/* eslint-disable @typescript-eslint/no-require-imports -- Verify per-event enforcement through real handlers and editor actions. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createRsvpFixture } = require('./helpers/rsvp-fixture.cjs');
const { createFixture } = require('./helpers/cloudinary-fixture.cjs');

test('each event enforces its allowance, including zero, one and ten, regardless of client input', async () => {
  for (const maximum of [0,1,5,10]) {
    const f = createRsvpFixture(); f.events.get(f.eventId).sections[0].maxCompanions = maximum;
    assert.equal((await f.submit({ ...f.values, companions: maximum })).status,200);
    assert.equal([...f.responses.values()][0].companions,maximum);
    assert.equal((await f.submit({ ...f.values, companions: maximum + 1 })).status,400);
    assert.equal([...f.responses.values()][0].companions,maximum);
  }
});
test('lowering the allowance preserves existing responses and requires an explicit valid update', async () => {
  const f = createRsvpFixture(); f.events.get(f.eventId).sections[0].maxCompanions=10;
  await f.submit({ ...f.values, companions:10 });
  f.events.get(f.eventId).sections[0].maxCompanions=0;
  assert.equal((await f.read()).status,200);
  assert.equal((await (await f.read()).json()).response.companions,10);
  assert.equal((await f.submit({ ...f.values, companions:1 })).status,400);
  assert.equal([...f.responses.values()][0].companions,10);
  assert.equal((await f.submit({ ...f.values, companions:0 })).status,200);
  assert.equal([...f.responses.values()][0].companions,0);
});
test('new invitations start without companions and existing invitations retain five by default', () => {
  const f = createFixture(), rsvp=f.load('lib/rsvp.ts');
  assert.equal(rsvp.eventCompanionLimit([{type:'rsvp',enabled:true}]),5);
  const section=f.load('lib/guided-invitation.ts').guidedSections('wedding').find(item=>item.type==='rsvp');
  assert.equal(section.maxCompanions,0);
});
test('editor saves the limit atomically and rejects invalid or misplaced limits', async () => {
  for (const maximum of [0,1,10,-1,11,1.5,'2']) {
    const f=createFixture();
    const values=f.load('lib/guided-invitation.ts').initialGuidedValues({...f.state.events.get('event'),eventType:'wedding',accent:'#E9560A',typography:'default',bodyTypography:'inter'});
    values.sections.find(item=>item.type==='rsvp').maxCompanions=maximum;
    const result=await f.actions.updateEvent('event',f.load('lib/invitation-editor.ts').editorFormData(JSON.stringify(values),0));
    assert.equal(result.ok,[0,1,10].includes(maximum));
    if (result.ok) assert.equal(f.state.events.get('event').sections.find(item=>item.type==='rsvp').maxCompanions,maximum);
    else assert.equal(f.state.events.get('event').contentVersion,0);
  }
});
