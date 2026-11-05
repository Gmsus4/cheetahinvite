/* eslint-disable @typescript-eslint/no-require-imports -- Exercise extraction and real persistence. */
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {createFixture}=require('./helpers/cloudinary-fixture.cjs');

test('photo sampling respects dominant population, ignores transparent pixels and handles neutral photos',()=>{
 const f=createFixture();const {dominantImageColor}=f.load('lib/invitation-palettes.ts');
 const pixels=[...Array.from({length:80},()=>[208,112,32,255]).flat(),...Array.from({length:20},()=>[0,0,255,255]).flat()];
 assert.equal(dominantImageColor(pixels),'#d07020');
 assert.equal(dominantImageColor([0,255,0,0,80,80,80,255]),'#505050');
 assert.equal(dominantImageColor([255,255,255,255]),'#ffffff');
 assert.equal(dominantImageColor([0,0,0,255]),'#000000');
 assert.throws(()=>dominantImageColor([255,0,0,0]));
});

test('basic and extracted palettes preserve readable contrast, valid hex values and unique choices',()=>{
 const f=createFixture();const {basicInvitationPalettes,paletteFromAccent,invitationPaletteChoices}=f.load('lib/invitation-palettes.ts');
 const {sharedInvitationDesign}=f.load('lib/shared-invitation.ts');
 assert.equal(basicInvitationPalettes.length,12);
 const luminance=hex=>{const channels=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return channels[0]*.2126+channels[1]*.7152+channels[2]*.0722;};
 for(const palette of [...basicInvitationPalettes,...['#ffffff','#000000','#ffef00','#d07020'].map(color=>paletteFromAccent(color))]){
  for(const field of ['accent','paper','panel','ink','muted','dark'])assert.match(palette[field],/^#[0-9a-f]{6}$/i);
  assert.ok((luminance('#fffaf2')+.05)/(luminance(palette.dark)+.05)>=4.5,palette.label);
 }
 const choices=invitationPaletteChoices(sharedInvitationDesign.palettes);
 assert.equal(new Set(choices.map(p=>p.accent.toLowerCase())).size,choices.length);
 assert.ok(choices.length>=18);
 assert.equal(paletteFromAccent('invalid').accent,'#58664e');
});

test('image colors and basic palettes survive saving and reopening for every occasion',async()=>{
 for(const eventType of ['wedding','birthday','graduation','baby_shower','anniversary','other']){
  const f=createFixture();const {paletteFromAccent}=f.load('lib/invitation-palettes.ts');
  const {initialGuidedValues}=f.load('lib/guided-invitation.ts');const {atmosphereStyle}=f.load('lib/wedding-atmosphere.ts');
  const {sharedInvitationDesign}=f.load('lib/shared-invitation.ts');
  for(const [index,accent] of ['#d07020','#397ac5'].entries()){
   const form=f.saveForm();form.set('eventType',eventType);form.set('templateId','celebration-v1');form.set('accent',accent);form.set('contentVersion',String(index));
   assert.equal((await f.actions.updateEvent('event',form)).ok,true);
   const saved=f.state.events.get('event');assert.equal(saved.accent,accent);
   const reopened=initialGuidedValues(saved);assert.equal(reopened.accent,accent);
   const style=atmosphereStyle(sharedInvitationDesign,reopened.accent);
   assert.equal(style['--wa-base'],paletteFromAccent(accent).dark);
   assert.equal(style['--wa-tint'],accent);
  }
 }
});
