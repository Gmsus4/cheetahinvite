/* eslint-disable @typescript-eslint/no-require-imports -- Exercise auth navigation with isolated forms and providers. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const React = require('react');

function fixture() {
  const cache = new Map();
  const f = { calls: [], navigations: [], mocks: new Map(), headers: { host: 'site.test', 'x-forwarded-proto': 'https' },
    result: { ok: true, url: 'https://site.test/dashboard' }, registrationOk: true };
  class FormDataMock {
    constructor(values) { this.values = values; }
    get(key) { return this.values[key] ?? null; }
  }
  f.load = file => {
    const absolute = path.resolve(file);
    if (cache.has(absolute)) return cache.get(absolute).exports;
    const mod = { exports: {} }; cache.set(absolute, mod);
    const code = ts.transpileModule(fs.readFileSync(absolute, 'utf8'), { compilerOptions: {
      module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true,
    } }).outputText;
    function requireMock(name) {
      if (f.mocks.has(name)) return f.mocks.get(name);
      if (name === 'server-only' || name.endsWith('.css')) return {};
      if (name === 'react') return { ...React, useState: initial => [initial, () => {}] };
      if (name === 'next/headers') return { headers: async () => new Headers(f.headers) };
      if (name === 'next/server') return { connection: async () => {} };
      if (name === 'next/navigation') return {
        useRouter: () => ({ push: url => f.navigations.push(url) }),
        redirect: url => { throw Object.assign(new Error('Redirect'), { destination: url }); },
      };
      if (name === 'next-auth/react') return { signIn: async (provider, options) => { f.calls.push({ provider, options }); return f.result; } };
      if (name === 'next/link') return ({ children, ...props }) => React.createElement('a', props, children);
      if (name === '@/auth') return { auth: async () => null };
      if (name === '@/prisma') throw new Error('Tests must not load the database');
      if (name === '@/components/ThemeToggle') return { ThemeToggle: () => null };
      if (name === '@/components/BrandLoader') return { BrandLoader: () => null };
      if (name === '@/components/BrandEmblem') return { BrandEmblem: () => null };
      if (name.startsWith('@/') || name.startsWith('.')) {
        const base = name.startsWith('@/') ? path.resolve(name.slice(2)) : path.resolve(path.dirname(absolute), name);
        return f.load(fs.existsSync(`${base}.ts`) ? `${base}.ts` : `${base}.tsx`);
      }
      return require(name);
    }
    new Function('require', 'module', 'exports', 'window', 'FormData', 'fetch', code)(
      requireMock, mod, mod.exports,
      { location: { assign: url => f.navigations.push(url) } }, FormDataMock,
      async () => ({ ok: f.registrationOk, json: async () => ({ ok: f.registrationOk, error: 'Registration failed' }) }),
    );
    return mod.exports;
  };
  return f;
}

function elements(node, predicate) {
  if (!node || typeof node !== 'object') return [];
  if (Array.isArray(node)) return node.flatMap(child => elements(child, predicate));
  return [...(predicate(node) ? [node] : []), ...elements(node.props?.children, predicate)];
}
const submission = () => ({ preventDefault() {}, currentTarget: {
  email: 'navigation@example.invalid', password: 'Test-password-123', confirmPassword: 'Test-password-123', name: 'Navigation test',
} });

test('internal destinations preserve the invitation, query and fragment, including auth-page round trips', () => {
  const { safeAuthDestination, authPageHref } = fixture().load('lib/auth-destination.ts');
  for (const destination of ['/crear', '/crear?resume=draft&tipo=wedding', '/dashboard/eventos/draft?tab=details#location', '/admin/ventas']) {
    assert.equal(safeAuthDestination(destination), destination);
    const registration = new URL(authPageHref('/registro', destination), 'https://site.test');
    const login = new URL(authPageHref('/login', registration.searchParams.get('callbackUrl')), 'https://site.test');
    assert.equal(login.searchParams.get('callbackUrl'), destination);
  }
});

test('missing, ambiguous, external and malformed callbacks fall back without redirect loops', () => {
  const { safeAuthDestination } = fixture().load('lib/auth-destination.ts');
  for (const value of [undefined, null, '', [], ['/crear', '/admin'], 123, 'crear',
    'https://other.test/crear', '//other.test', '///other.test', '/\\other.test', '/%2f%2fother.test', '/%5cother.test',
    'javascript:alert(1)', '/\n/other.test', '/%0d%0aother.test', '/%', ' /crear',
    '/login', '/registro?callbackUrl=/crear', '/login/', '/api/auth/signin', '/%6cogin', '/dashboard/../registro']) {
    assert.equal(safeAuthDestination(value), '/dashboard', JSON.stringify(value));
  }
});

test('absolute callbacks from Auth.js are converted only when they belong to the current origin', async () => {
  const f = fixture();
  const { authDestinationFromRequest } = f.load('lib/auth-destination-server.ts');
  assert.equal(await authDestinationFromRequest('https://site.test/crear?resume=draft'), '/crear?resume=draft');
  assert.equal(await authDestinationFromRequest('https://site.test.other.test/crear'), '/dashboard');
  assert.equal(await authDestinationFromRequest('https://user@site.test/crear'), '/dashboard');
  assert.equal(await authDestinationFromRequest('http://site.test/crear'), '/dashboard');
  f.headers = { host: 'internal:3000', 'x-forwarded-host': 'site.test', 'x-forwarded-proto': 'https' };
  assert.equal(await authDestinationFromRequest('https://site.test/crear?resume=draft'), '/crear?resume=draft');
  f.headers = { host: 'localhost:3000' };
  assert.equal(await authDestinationFromRequest('http://localhost:3000/dashboard/eventos/draft'), '/dashboard/eventos/draft');
});

test('login and registration pages supply the same safe destination to both providers and the account switch', async () => {
  const f = fixture();
  for (const page of ['login', 'registro']) {
    for (const [callbackUrl, expected] of [['/crear?resume=draft', '/crear?resume=draft'],
      ['https://site.test/dashboard/eventos/draft', '/dashboard/eventos/draft'], ['//other.test', '/dashboard'], [undefined, '/dashboard']]) {
      const wrapper = f.load(`app/${page}/page.tsx`).default({ searchParams: Promise.resolve({ callbackUrl }) });
      assert.equal(wrapper.type, React.Suspense);
      const content = await wrapper.props.children.type(wrapper.props.children.props);
      const recipients = elements(content, node => node.props?.redirectTo !== undefined);
      assert.equal(recipients.length, 3);
      assert.ok(recipients.every(node => node.props.redirectTo === expected));
    }
  }
});

test('credential login returns to the requested invitation and keeps errors on the form', async () => {
  const f = fixture();
  const { LoginForm } = f.load('components/login/LoginForm.tsx');
  const destination = '/dashboard/eventos/draft/show';
  await LoginForm({ redirectTo: destination }).props.onSubmit(submission());
  assert.equal(f.calls[0].options.redirectTo, destination);
  assert.deepEqual(f.navigations, [destination]);
  f.result = { error: 'CredentialsSignin' };
  await LoginForm({ redirectTo: '/crear' }).props.onSubmit(submission());
  assert.deepEqual(f.navigations, [destination]);
});

test('registration keeps its destination on success and if automatic sign-in requires retry', async () => {
  const f = fixture();
  const { RegisterForm } = f.load('components/login/RegisterForm.tsx');
  const destination = '/crear?resume=draft&tipo=wedding';
  await RegisterForm({ redirectTo: destination }).props.onSubmit(submission());
  assert.equal(f.calls[0].options.redirectTo, destination);
  assert.equal(f.navigations[0], destination);
  f.result = { error: 'CredentialsSignin' };
  await RegisterForm({ redirectTo: destination }).props.onSubmit(submission());
  const retry = new URL(f.navigations[1], 'https://site.test');
  assert.equal(retry.pathname, '/login');
  assert.equal(retry.searchParams.get('callbackUrl'), destination);
  assert.equal(retry.searchParams.get('registered'), '1');
  f.registrationOk = false;
  await RegisterForm({ redirectTo: destination }).props.onSubmit(submission());
  assert.equal(f.navigations.length, 2);
  assert.equal(f.calls.length, 2);
});

test('Google receives the original destination and ignores external destinations', async () => {
  const f = fixture();
  const { GoogleSignInButton } = f.load('components/auth/GoogleSignInButton.tsx');
  await GoogleSignInButton({ redirectTo: '/crear?resume=draft' }).props.onClick();
  await GoogleSignInButton({ redirectTo: '//other.test' }).props.onClick();
  assert.deepEqual(f.calls.map(call => [call.provider, call.options.redirectTo]), [
    ['google', '/crear?resume=draft'], ['google', '/dashboard'],
  ]);
});

test('switching between login and registration retains the destination', () => {
  const f = fixture();
  const { AuthAccountSwitch } = f.load('components/login/AuthAccountSwitch.tsx');
  for (const mode of ['login', 'register']) {
    const view = AuthAccountSwitch({ mode, redirectTo: '/crear?resume=draft' });
    const [link] = elements(view, node => node.props?.href);
    const url = new URL(link.props.href, 'https://site.test');
    assert.equal(url.pathname, mode === 'login' ? '/registro' : '/login');
    assert.equal(url.searchParams.get('callbackUrl'), '/crear?resume=draft');
  }
});

test('an unauthenticated creation URL keeps its resume and event-type parameters through login', async () => {
  const f = fixture();
  f.mocks.set('@/prisma', {});
  f.mocks.set('@/components/dashboard/InvitationEditor', {});
  f.mocks.set('@/components/dashboard/DashboardHeader', {});
  f.mocks.set('@/components/dashboard/CreationDraftResume', {});
  f.mocks.set('@/lib/site-pricing', {});
  const wrapper = f.load('app/crear/page.tsx').default({ searchParams: Promise.resolve({
    resume: 'existing-draft', tipo: 'wedding', error: 'ignored', callbackUrl: '//other.test',
  }) });
  await assert.rejects(wrapper.props.children.type(wrapper.props.children.props), error => {
    const login = new URL(error.destination, 'https://site.test');
    assert.equal(login.pathname, '/login');
    const destination = new URL(login.searchParams.get('callbackUrl'), 'https://site.test');
    assert.equal(destination.pathname, '/crear');
    assert.deepEqual([...destination.searchParams], [['tipo', 'wedding'], ['resume', 'existing-draft']]);
    return true;
  });
});

test('an expired checkout session returns to its payment page after authentication', async () => {
  const f = fixture();
  for (const name of ['@/prisma', '@/lib/stripe', '@/lib/payment-checkout', '@/lib/guided-invitation', '@/lib/invitation-lifecycle']) f.mocks.set(name, {});
  const { startCheckout } = f.load('app/dashboard/eventos/[id]/pago/actions.ts');
  await assert.rejects(startCheckout('existing-draft'), error => {
    const login = new URL(error.destination, 'https://site.test');
    assert.equal(login.pathname, '/login');
    assert.equal(login.searchParams.get('callbackUrl'), '/dashboard/eventos/existing-draft/pago');
    return true;
  });
  assert.equal(f.calls.length, 0);
});
