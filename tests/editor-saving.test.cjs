/* eslint-disable @typescript-eslint/no-require-imports -- Exercise actual actions against an isolated data store. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { createFixture } = require('./helpers/cloudinary-fixture.cjs');

test('concurrent saves have one winner, retain the other copy and allow a deliberate retry', async () => {
  const f = createFixture();
  const first = f.saveForm(), second = f.saveForm(); first.set('name', 'Primera'); second.set('name', 'Segunda');
  const results = await Promise.all([f.actions.updateEvent('event', first), f.actions.updateEvent('event', second)]);
  assert.equal(results.filter(result => result.ok).length, 1);
  assert.equal(results.find(result => !result.ok).code, 'conflict');
  assert.equal(results.find(result => !result.ok).version, 1);
  second.set('contentVersion', '1');
  assert.equal((await f.actions.updateEvent('event', second)).version, 2);
  assert.equal(f.state.events.get('event').name, 'Segunda');
});

test('automatic writes cannot change a published invitation; manual writes still require its version', async () => {
  const f = createFixture(); const event = f.state.events.get('event'); event.paidAt = new Date(); event.expiresAt = new Date(Date.now() + 365 * 86400000); event.status = 'PUBLISHED';
  const form = f.saveForm(); form.set('name', 'Nuevo nombre');
  assert.equal((await f.actions.updateEvent('event', form, 'auto')).code, 'published');
  assert.equal(f.state.events.get('event').name, 'Celebración');
  assert.equal((await f.actions.updateEvent('event', form)).ok, true);
});

test('validation, missing versions, session expiry and another owner return errors without redirects or mutation', async () => {
  const f = createFixture(); const initial = structuredClone(f.state.events.get('event'));
  const invalid = f.saveForm(); invalid.set('name', '');
  assert.equal((await f.actions.updateEvent('event', invalid)).code, 'validation');
  const missing = f.saveForm(); missing.delete('contentVersion');
  assert.equal((await f.actions.updateEvent('event', missing)).code, 'validation');
  f.owner = null; assert.equal((await f.actions.updateEvent('event', f.saveForm())).code, 'auth');
  f.owner = 'other'; f.state.users.set('other', { id: 'other' });
  assert.equal((await f.actions.updateEvent('event', f.saveForm())).code, 'not-found');
  assert.deepEqual(f.state.events.get('event'), initial);
});

test('publication rejects an outdated version before changing payment state', async () => {
  const f = createFixture();
  const form = f.saveForm();
  for (const [key, value] of Object.entries({ hostNames: 'Alex y Sam', eventDate: '2027-01-15', eventTime: '18:00', venue: 'Salón', address: 'Calle' })) form.set(key, value);
  await f.actions.updateEvent('event', form);
  assert.equal((await f.actions.publishEvent('event', 0)).code, 'conflict');
  assert.equal(f.state.events.get('event').status, 'DRAFT');
  assert.equal((await f.actions.publishEvent('event', 1)).ok, true);
  assert.equal(f.state.events.get('event').status, 'PENDING_PAYMENT');
});

test('creation retries and simultaneous requests reuse one draft and consume only one account slot', async () => {
  const f = createFixture(); const { prepareEvent } = f.load('app/crear/actions.ts');
  f.state.users.get('owner').invitationCount = 2;
  const form = f.saveForm(); form.set('creationKey', randomUUID());
  const results = await Promise.all([prepareEvent(form), prepareEvent(form)]);
  assert.equal(results.every(result => result.ok), true);
  assert.equal(results[0].eventId, results[1].eventId);
  assert.equal(f.state.users.get('owner').invitationCount, 3);
  assert.equal((await prepareEvent(form)).eventId, results[0].eventId);
  assert.equal(f.state.events.size, 2);
});

test('a save racing with publication returns the new version for an explicit conflict decision', async () => {
  const f = createFixture();
  Object.assign(f.state.events.get('event'), { eventType: 'wedding', hostNames: 'Alex y Sam', eventDate: new Date('2027-01-15T12:00:00Z'), eventTime: '18:00', venue: 'Salón', address: 'Calle' });
  f.prisma.event.updateMany = async () => { f.state.events.get('event').contentVersion = 1; return { count: 0 }; };
  const result = await f.actions.publishEvent('event', 0);
  assert.equal(result.code, 'conflict');
  assert.equal(result.version, 1);
  assert.equal(f.state.events.get('event').status, 'DRAFT');
});


test('glass borders can be disabled, saved and restored without changing the finish', async () => {
  const f = createFixture();
  const { initialGuidedValues } = f.load('lib/guided-invitation.ts');
  assert.equal(initialGuidedValues(f.state.events.get('event')).glassBorder, true);
  for (const glassBorder of [false, true, false]) {
    const form = f.saveForm();
    form.set('contentVersion', String(f.state.events.get('event').contentVersion));
    form.set('panelStyle', 'glass');
    form.set('glassBorder', String(glassBorder));
    assert.equal((await f.actions.updateEvent('event', form)).ok, true);
    const restored = initialGuidedValues(f.state.events.get('event'));
    assert.equal(restored.glassBorder, glassBorder);
    assert.equal(restored.panelStyle, 'glass');
  }
  const legacy = f.saveForm();
  legacy.set('contentVersion', String(f.state.events.get('event').contentVersion));
  assert.equal((await f.actions.updateEvent('event', legacy)).ok, true);
  assert.equal(f.state.events.get('event').glassBorder, false);
  for (const value of ['0', 'yes', '']) {
    const form = f.saveForm();
    form.set('contentVersion', String(f.state.events.get('event').contentVersion));
    form.set('glassBorder', value);
    assert.equal((await f.actions.updateEvent('event', form)).code, 'validation');
    assert.equal(f.state.events.get('event').glassBorder, false);
  }
});

test('page background blur persists independently from section blur and preserves legacy saves', async () => {
  const f = createFixture();
  const { initialGuidedValues } = f.load('lib/guided-invitation.ts');
  assert.equal(initialGuidedValues(f.state.events.get('event')).backgroundBlurIntensity, 0);
  for (const backgroundBlurIntensity of [100, 35, 0, 60]) {
    const form = f.saveForm();
    form.set('contentVersion', String(f.state.events.get('event').contentVersion));
    form.set('backgroundBlurIntensity', String(backgroundBlurIntensity));
    form.set('blurIntensity', '17');
    form.set('panelStyle', 'none');
    assert.equal((await f.actions.updateEvent('event', form)).ok, true);
    const restored = initialGuidedValues(f.state.events.get('event'));
    assert.equal(restored.backgroundBlurIntensity, backgroundBlurIntensity);
    assert.equal(restored.blurIntensity, 17);
    assert.equal(restored.panelStyle, 'none');
  }
  const legacy = f.saveForm();
  legacy.set('contentVersion', String(f.state.events.get('event').contentVersion));
  assert.equal((await f.actions.updateEvent('event', legacy)).ok, true);
  assert.equal(f.state.events.get('event').backgroundBlurIntensity, 60);
  for (const value of ['-1', '101', '1.5', 'NaN', '', 'true']) {
    const form = f.saveForm();
    form.set('contentVersion', String(f.state.events.get('event').contentVersion));
    form.set('backgroundBlurIntensity', value);
    assert.equal((await f.actions.updateEvent('event', form)).code, 'validation');
    assert.equal(f.state.events.get('event').backgroundBlurIntensity, 60);
  }
});

test('page background dimming persists independently from blur and preserves legacy saves', async () => {
  const f = createFixture();
  const { initialGuidedValues } = f.load('lib/guided-invitation.ts');
  assert.equal(initialGuidedValues(f.state.events.get('event')).backgroundDimIntensity, 0);
  for (const backgroundDimIntensity of [100, 30, 0, 60]) {
    const form = f.saveForm();
    form.set('contentVersion', String(f.state.events.get('event').contentVersion));
    form.set('backgroundDimIntensity', String(backgroundDimIntensity));
    form.set('backgroundBlurIntensity', '75');
    form.set('blurIntensity', '17');
    form.set('panelStyle', 'none');
    assert.equal((await f.actions.updateEvent('event', form)).ok, true);
    const restored = initialGuidedValues(f.state.events.get('event'));
    assert.equal(restored.backgroundDimIntensity, backgroundDimIntensity);
    assert.equal(restored.backgroundBlurIntensity, 75);
    assert.equal(restored.blurIntensity, 17);
    assert.equal(restored.panelStyle, 'none');
  }
  const legacy = f.saveForm();
  legacy.set('contentVersion', String(f.state.events.get('event').contentVersion));
  assert.equal((await f.actions.updateEvent('event', legacy)).ok, true);
  assert.equal(f.state.events.get('event').backgroundDimIntensity, 60);
  for (const value of ['-1', '101', '1.5', 'NaN', '', 'true']) {
    const form = f.saveForm();
    form.set('contentVersion', String(f.state.events.get('event').contentVersion));
    form.set('backgroundDimIntensity', value);
    assert.equal((await f.actions.updateEvent('event', form)).code, 'validation');
    assert.equal(f.state.events.get('event').backgroundDimIntensity, 60);
  }
});

test('cover layouts save and reopen independently from section finishes and support older clients', async () => {
  const f = createFixture();
  const { initialGuidedValues } = f.load('lib/guided-invitation.ts');
  assert.equal(initialGuidedValues(f.state.events.get('event')).coverLayout, 'split');
  for (const coverLayout of ['split', 'split-reverse', 'stacked', 'overlay']) {
    const form = f.saveForm();
    form.set('contentVersion', String(f.state.events.get('event').contentVersion));
    form.set('coverLayout', coverLayout);
    form.set('panelStyle', 'none');
    assert.equal((await f.actions.updateEvent('event', form)).ok, true);
    const restored = initialGuidedValues(f.state.events.get('event'));
    assert.equal(restored.coverLayout, coverLayout);
    assert.equal(restored.panelStyle, 'none');
  }
  const legacy = f.saveForm();
  legacy.set('contentVersion', String(f.state.events.get('event').contentVersion));
  assert.equal((await f.actions.updateEvent('event', legacy)).ok, true);
  assert.equal(f.state.events.get('event').coverLayout, 'overlay');
  for (const value of ['', 'invalid', 'true']) {
    const form = f.saveForm();
    form.set('contentVersion', String(f.state.events.get('event').contentVersion));
    form.set('coverLayout', value);
    assert.equal((await f.actions.updateEvent('event', form)).code, 'validation');
    assert.equal(f.state.events.get('event').coverLayout, 'overlay');
  }
});

test('global finishes persist independently and restore per-section choices after reload', async () => {
  const f = createFixture();
  const { initialGuidedValues } = f.load('lib/guided-invitation.ts');
  const sections = [{ id: 'story', type: 'story', title: 'Historia', content: 'Nuestra historia', detail: '', link: '', imageUrl: '', enabled: true, panelStyle: 'glass' }];
  for (const panelStyle of ['blur', 'blur-color', 'color', 'glass', 'none', 'auto']) {
    const form = f.saveForm();
    form.set('contentVersion', String(f.state.events.get('event').contentVersion));
    form.set('panelStyle', panelStyle);
    form.set('sections', JSON.stringify(sections));
    assert.equal((await f.actions.updateEvent('event', form)).ok, true);
    const stored = f.state.events.get('event');
    assert.equal(stored.panelStyle, panelStyle);
    assert.equal(stored.sections[0].panelStyle, 'glass');
    const restored = initialGuidedValues(stored);
    assert.equal(restored.panelStyle, panelStyle);
    assert.equal(restored.sections[0].panelStyle, 'glass');
  }
  const legacy = f.saveForm();
  legacy.set('contentVersion', String(f.state.events.get('event').contentVersion));
  f.state.events.get('event').panelStyle = 'blur';
  assert.equal((await f.actions.updateEvent('event', legacy)).ok, true);
  assert.equal(f.state.events.get('event').panelStyle, 'blur');
});

test('primary location visibility, title and finish survive saving and reopening', async () => {
  const f = createFixture();
  const { initialGuidedValues } = f.load('lib/guided-invitation.ts');
  const location = { id: 'main-location', type: 'location', title: 'La celebración', titleCustomized: true, content: '', detail: '', link: 'https://maps.app.goo.gl/ExactPin', imageUrl: '', enabled: false, panelStyle: 'glass' };
  const cover = { ...location, id: 'main-cover', type: 'cover', title: 'Portada', enabled: true, panelStyle: 'color' };
  const countdown = { ...cover, id: 'main-countdown', type: 'countdown', title: 'Cada vez más cerca', panelStyle: 'blur-color' };
  const form = f.saveForm();
  form.set('sections', JSON.stringify([cover, countdown, location]));
  assert.equal((await f.actions.updateEvent('event', form)).ok, true);
  const restored = initialGuidedValues(f.state.events.get('event'));
  assert.deepEqual(restored.sections.find(section => section.type === 'location'), { ...location, layout: 'auto' });
  assert.deepEqual(restored.sections.find(section => section.type === 'cover'), { ...cover, layout: 'auto' });
  assert.deepEqual(restored.sections.find(section => section.type === 'countdown'), { ...countdown, layout: 'auto' });
});

test('invalid global finishes are rejected without changing the saved invitation', async () => {
  const f = createFixture();
  const before = structuredClone(f.state.events.get('event'));
  for (const value of ['', 'invalid', 'BLUR']) {
    const form = f.saveForm(); form.set('panelStyle', value);
    assert.equal((await f.actions.updateEvent('event', form)).code, 'validation');
    assert.deepEqual(f.state.events.get('event'), before);
  }
});


test('blur intensity saves and reloads independently from the finish, including zero', async () => {
  const f = createFixture();
  const { initialGuidedValues } = f.load('lib/guided-invitation.ts');
  for (const intensity of [0, 25, 50, 100]) {
    const form = f.saveForm();
    form.set('contentVersion', String(f.state.events.get('event').contentVersion));
    form.set('blurIntensity', String(intensity));
    form.set('panelStyle', 'blur-color');
    assert.equal((await f.actions.updateEvent('event', form)).ok, true);
    assert.equal(initialGuidedValues(f.state.events.get('event')).blurIntensity, intensity);
  }
  const legacy = f.saveForm();
  legacy.set('contentVersion', String(f.state.events.get('event').contentVersion));
  assert.equal((await f.actions.updateEvent('event', legacy)).ok, true);
  assert.equal(f.state.events.get('event').blurIntensity, 100);
});

test('invalid blur intensities cannot overwrite the saved invitation', async () => {
  const f = createFixture();
  const before = structuredClone(f.state.events.get('event'));
  for (const value of ['', '-1', '101', '50.5', 'abc', 'Infinity']) {
    const form = f.saveForm(); form.set('blurIntensity', value);
    assert.equal((await f.actions.updateEvent('event', form)).code, 'validation');
    assert.deepEqual(f.state.events.get('event'), before);
  }
});


test('section text alignment survives saving and reopening while invalid alignments are rejected', async () => {
  const f = createFixture();
  const { initialGuidedValues } = f.load('lib/guided-invitation.ts');
  for (const textAlign of ['auto', 'left', 'center', 'right']) {
    const form = f.saveForm();
    form.set('contentVersion', String(f.state.events.get('event').contentVersion));
    form.set('sections', JSON.stringify([{ id:'story', type:'story', title:'Historia', content:'Texto', detail:'', link:'', imageUrl:'', enabled:true, textAlign }]));
    assert.equal((await f.actions.updateEvent('event', form)).ok, true);
    assert.equal(initialGuidedValues(f.state.events.get('event')).sections.find(s => s.id === 'story').textAlign, textAlign);
  }
  for (const textAlign of ['justify', '', null, 2]) {
    const form = f.saveForm();
    form.set('contentVersion', String(f.state.events.get('event').contentVersion));
    form.set('sections', JSON.stringify([{ id:'story', type:'story', title:'Historia', content:'Texto', detail:'', link:'', imageUrl:'', enabled:true, textAlign }]));
    assert.equal((await f.actions.updateEvent('event', form)).code, 'validation');
  }
});


test('global section corners persist across saving and reopening and reject invalid choices', async () => {
 const f=createFixture();const {initialGuidedValues}=f.load('lib/guided-invitation.ts');
 for(const sectionCorners of ['square','soft','rounded']) {
  const form=f.saveForm();form.set('contentVersion',String(f.state.events.get('event').contentVersion));form.set('sectionCorners',sectionCorners);
  assert.equal((await f.actions.updateEvent('event',form)).ok,true);
  assert.equal(initialGuidedValues(f.state.events.get('event')).sectionCorners,sectionCorners);
 }
 const before=structuredClone(f.state.events.get('event'));
 for(const sectionCorners of ['invalid','', '18px']) {
  const form=f.saveForm();form.set('contentVersion',String(before.contentVersion));form.set('sectionCorners',sectionCorners);
  assert.equal((await f.actions.updateEvent('event',form)).code,'validation');
  assert.deepEqual(f.state.events.get('event'),before);
 }
 const form=f.saveForm();form.set('contentVersion',String(before.contentVersion));assert.equal((await f.actions.updateEvent('event',form)).ok,true);
 assert.equal(f.state.events.get('event').sectionCorners,'rounded');
});


test('per-section icon visibility survives saving and reopening and rejects nonboolean values',async()=>{
 const f=createFixture();const {initialGuidedValues}=f.load('lib/guided-invitation.ts');
 for(const showIcon of [false,true]) {
  const form=f.saveForm();form.set('contentVersion',String(f.state.events.get('event').contentVersion));
  form.set('sections',JSON.stringify([{id:'story',type:'story',title:'Historia',content:'Texto',detail:'',link:'',imageUrl:'',enabled:true,showIcon}]));
  assert.equal((await f.actions.updateEvent('event',form)).ok,true);
  assert.equal(initialGuidedValues(f.state.events.get('event')).sections.find(s=>s.id==='story').showIcon,showIcon);
 }
 for(const showIcon of ['false',0,null]) {
  const form=f.saveForm();form.set('contentVersion',String(f.state.events.get('event').contentVersion));
  form.set('sections',JSON.stringify([{id:'story',type:'story',title:'Historia',content:'Texto',detail:'',link:'',imageUrl:'',enabled:true,showIcon}]));
  assert.equal((await f.actions.updateEvent('event',form)).code,'validation');
 }
});


test('global icon visibility is saved independently from individual preferences',async()=>{
 const f=createFixture();const {initialGuidedValues}=f.load('lib/guided-invitation.ts');
 const section={id:'story',type:'story',title:'Historia',content:'Texto',detail:'',link:'',imageUrl:'',enabled:true,showIcon:false};
 for(const showSectionIcons of [false,true]) {
  const form=f.saveForm();form.set('contentVersion',String(f.state.events.get('event').contentVersion));form.set('showSectionIcons',String(showSectionIcons));form.set('sections',JSON.stringify([section]));
  assert.equal((await f.actions.updateEvent('event',form)).ok,true);
  const restored=initialGuidedValues(f.state.events.get('event'));assert.equal(restored.showSectionIcons,showSectionIcons);assert.equal(restored.sections.find(s=>s.id==='story').showIcon,false);
 }
 for(const value of ['0','yes','']) {const form=f.saveForm();form.set('contentVersion',String(f.state.events.get('event').contentVersion));form.set('showSectionIcons',value);assert.equal((await f.actions.updateEvent('event',form)).code,'validation');}
});


test('disabled sections retain their content and settings, survive reopening and can be restored from the picker',async()=>{
 const f=createFixture();const {initialGuidedValues,availableGuidedSections}=f.load('lib/guided-invitation.ts');
 const section={id:'story',type:'story',title:'Nuestra historia',content:'Un recuerdo personal',detail:'',link:'',imageUrl:'',imagePosition:'before',panelStyle:'glass',textAlign:'right',showIcon:false,enabled:false};
 const form=f.saveForm();form.set('sections',JSON.stringify([section]));assert.equal((await f.actions.updateEvent('event',form)).ok,true);
 const restored=initialGuidedValues(f.state.events.get('event'));
 assert.deepEqual(restored.sections.find(s=>s.id==='story'),{...section,layout:'auto'});
 assert.ok(availableGuidedSections('wedding',restored.sections).some(s=>s.id==='story'));
 const next=f.saveForm();next.set('contentVersion',String(f.state.events.get('event').contentVersion));next.set('sections',JSON.stringify(restored.sections.map(s=>s.id==='story'?{...s,enabled:true}:s)));
 assert.equal((await f.actions.updateEvent('event',next)).ok,true);
 const active=initialGuidedValues(f.state.events.get('event'));assert.deepEqual(active.sections.find(s=>s.id==='story'),{...section,layout:'auto',enabled:true});assert.ok(!availableGuidedSections('wedding',active.sections).some(s=>s.id==='story'));
 const extra={...section,id:'custom',type:'custom'};assert.ok(availableGuidedSections('wedding',[extra]).some(s=>s.id==='custom'));
});


test('mobile and desktop framing persist independently for cover and section photos and reject invalid positions', async () => {
 const f = createFixture();
 const { initialGuidedValues } = f.load('lib/guided-invitation.ts');
 for (const mobileImageFocus of ['top', 'center', 'bottom', 'left', 'right', 'top-left', 'top-right', 'bottom-left', 'bottom-right']) {
  const desktopImageFocus = { top:'bottom', center:'top', bottom:'center', left:'right', right:'left', 'top-left':'bottom-right', 'top-right':'bottom-left', 'bottom-left':'top-right', 'bottom-right':'top-left' }[mobileImageFocus];
  const form = f.saveForm();
  form.set('contentVersion', String(f.state.events.get('event').contentVersion));
  form.set('sections', JSON.stringify(['cover', 'story', 'gallery'].map(type => ({ id:type, type, title:type, content:'Texto', detail:'', link:'', imageUrl:'', enabled:true, mobileImageFocus, desktopImageFocus }))));
  assert.equal((await f.actions.updateEvent('event', form)).ok, true);
  const restored = initialGuidedValues(f.state.events.get('event'));
  for (const type of ['cover', 'story', 'gallery']) {
   assert.equal(restored.sections.find(section => section.type === type).mobileImageFocus, mobileImageFocus);
   assert.equal(restored.sections.find(section => section.type === type).desktopImageFocus, desktopImageFocus);
  }
 }
 const before = structuredClone(f.state.events.get('event'));
 for (const key of ['mobileImageFocus', 'desktopImageFocus']) for (const value of ['', 'diagonal', 'TOP', null, 50]) {
  const form = f.saveForm();
  form.set('contentVersion', String(before.contentVersion));
  form.set('sections', JSON.stringify([{ id:'story', type:'story', title:'Historia', content:'Texto', detail:'', link:'', imageUrl:'', enabled:true, [key]:value }]));
  assert.equal((await f.actions.updateEvent('event', form)).code, 'validation');
  assert.deepEqual(f.state.events.get('event'), before);
 }
});


test('closing text and visibility survive saving and reopening', async () => {
 const f=createFixture(); const {initialGuidedValues}=f.load('lib/guided-invitation.ts');
 for(const enabled of [true,false,true]) {
  const section={id:'closing',type:'closing',title:'Hasta pronto',content:'Gracias por venir',detail:'',link:'',imageUrl:'',enabled};
  const form=f.saveForm();form.set('contentVersion',String(f.state.events.get('event').contentVersion));form.set('sections',JSON.stringify([section]));
  assert.equal((await f.actions.updateEvent('event',form)).ok,true);
  assert.deepEqual(initialGuidedValues(f.state.events.get('event')).sections.find(s=>s.type==='closing'),{...section,layout:'auto'});
 }
});

test('section margins survive saving and reopening and reject unsupported values', async () => {
  const f = createFixture();
  const { initialGuidedValues } = f.load('lib/guided-invitation.ts');
  for (const margin of [undefined, 'default', 'wide', 'none', '', '24px', null, 0]) {
    const form = f.saveForm();
    form.set('contentVersion', String(f.state.events.get('event').contentVersion));
    form.set('sections', JSON.stringify([{ id:'story', type:'story', title:'Historia', content:'Texto', detail:'', link:'', imageUrl:'', enabled:true, margin }]));
    const before = structuredClone(f.state.events.get('event'));
    const result = await f.actions.updateEvent('event', form);
    if (margin === undefined || ['default', 'wide', 'none'].includes(margin)) {
      assert.equal(result.ok, true);
      assert.equal(initialGuidedValues(f.state.events.get('event')).sections.find(s => s.id === 'story').margin, margin);
    } else {
      assert.equal(result.code, 'validation');
      assert.deepEqual(f.state.events.get('event'), before);
    }
  }
});

test('separate mobile photo and content margins persist independently and reject invalid settings', async () => {
  const f=createFixture();
  const {initialGuidedValues}=f.load('lib/guided-invitation.ts');
  for(const textMargin of ['default','wide','none']) for(const photoMargin of ['default','wide','none']) {
    const form=f.saveForm();form.set('contentVersion',String(f.state.events.get('event').contentVersion));
    form.set('sections',JSON.stringify([{id:'story',type:'story',title:'Historia',content:'Texto',detail:'',link:'',imageUrl:'',enabled:true,margin:'none',textMargin,photoMargin}]));
    assert.equal((await f.actions.updateEvent('event',form)).ok,true);
    const saved=initialGuidedValues(f.state.events.get('event')).sections.find(s=>s.id==='story');
    assert.equal(saved.textMargin,textMargin);assert.equal(saved.photoMargin,photoMargin);assert.equal(saved.margin,'none');
  }
  for(const field of ['textMargin','photoMargin']) for(const invalid of [null,'20px',0]) {
    const form=f.saveForm();form.set('contentVersion',String(f.state.events.get('event').contentVersion));
    const before=structuredClone(f.state.events.get('event'));
    form.set('sections',JSON.stringify([{id:'story',type:'story',title:'Historia',content:'',detail:'',link:'',imageUrl:'',enabled:true,[field]:invalid}]));
    assert.equal((await f.actions.updateEvent('event',form)).code,'validation');
    assert.deepEqual(f.state.events.get('event'),before);
  }
});
