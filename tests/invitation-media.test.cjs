/* eslint-disable @typescript-eslint/no-require-imports -- Exercise curated designs and real server actions with an isolated store. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createFixture } = require('./helpers/cloudinary-fixture.cjs');

function setup() {
  const f = createFixture();
  return { f, ...f.load('lib/guided-invitation.ts') };
}

test('background saves independently, survives reopening and legacy saves, and keeps image ownership checks', async t => {
  const originalCloud = process.env.CLOUDINARY_CLOUD_NAME;
  process.env.CLOUDINARY_CLOUD_NAME = 'test';
  t.after(() => { if (originalCloud === undefined) delete process.env.CLOUDINARY_CLOUD_NAME; else process.env.CLOUDINARY_CLOUD_NAME = originalCloud; });
  const {f}=setup();
  const cover=f.addAsset(), background=f.addAsset();
  const form=f.saveForm(cover.url); form.set('templateId','wedding-floral-v1'); form.set('backgroundImageUrl',background.url);
  assert.equal((await f.actions.updateEvent('event',form)).ok,true);
  const saved=f.state.events.get('event');
  assert.equal(saved.imageUrl,cover.url); assert.equal(saved.backgroundImageUrl,background.url);
  const opened=f.load('lib/guided-invitation.ts').initialGuidedValues(saved);
  assert.equal(opened.backgroundImageUrl,background.url);
  const legacy=f.saveForm(cover.url); assert.equal((await f.actions.updateEvent('event',legacy)).ok,true);
  assert.equal(f.state.events.get('event').backgroundImageUrl,background.url);
  const invalid=f.saveForm(cover.url); invalid.set('backgroundImageUrl','javascript:alert(1)');
  assert.equal((await f.actions.updateEvent('event',invalid)).code,'validation');
  const foreign=f.addAsset({ownerId:'another'});
  const bad=f.saveForm(cover.url); bad.set('backgroundImageUrl',foreign.url);
  assert.equal((await f.actions.updateEvent('event',bad)).code,'validation');
  const cleared=f.saveForm(cover.url); cleared.set('backgroundImageUrl','');
  assert.equal((await f.actions.updateEvent('event',cleared)).ok,true);
  assert.equal(f.state.events.get('event').backgroundImageUrl,null);
  assert.equal(f.state.events.get('event').imageUrl,cover.url);
});

test('section surface selections survive saving and reopening, with invalid values rejected', async () => {
  const { f } = setup();
  for (const panelStyle of ['auto','blur','blur-color','color','invalid']) {
    const section = { id:'story',type:'story',title:'Historia',content:'Nuestro texto',detail:'',link:'',imageUrl:'',enabled:true,panelStyle };
    const form = f.saveForm('', [section]); form.set('templateId','wedding-floral-v1');
    const result = await f.actions.updateEvent('event',form);
    if (panelStyle === 'invalid') { assert.equal(result.code,'validation'); continue; }
    assert.equal(result.ok,true);
    const saved = f.state.events.get('event');
    assert.equal(saved.sections[0].panelStyle,panelStyle);
    assert.equal(f.load('lib/guided-invitation.ts').initialGuidedValues(saved).sections[0].panelStyle,panelStyle);
  }
});

test('section photo position survives saving, opening and reopening, and invalid positions are rejected', async () => {
  const { f } = setup();
  const asset = f.addAsset();
  for (const imagePosition of ['before', 'after']) {
    const section = { id: 'story', type: 'story', title: 'Nuestra historia', content: 'Nuestros recuerdos', detail: '', link: '', imageUrl: asset.url, imagePosition, enabled: true };
    const form = f.saveForm('', [section]);
    form.set('templateId', 'wedding-floral-v1');
    assert.equal((await f.actions.updateEvent('event', form)).ok, true);
    const saved = f.state.events.get('event');
    assert.equal(saved.sections[0].imagePosition, imagePosition);
    assert.equal(saved.sections[0].imageUrl, asset.url);
    const reopened = f.load('lib/guided-invitation.ts').initialGuidedValues(saved);
    assert.equal(reopened.sections.find(s => s.id === 'story').imagePosition, imagePosition);
  }
  const invalid = f.saveForm('', [{ ...f.state.events.get('event').sections[0], imagePosition: 'sideways' }]);
  invalid.set('templateId', 'wedding-floral-v1');
  assert.equal((await f.actions.updateEvent('event', invalid)).code, 'validation');
});
