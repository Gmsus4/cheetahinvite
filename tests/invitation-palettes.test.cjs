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
  const {initialGuidedValues}=f.load('lib/guided-invitation.ts');const {atmosphereStyle}=f.load('lib/invitation-atmosphere.ts');
  for(const [index,accent] of ['#d07020','#397ac5'].entries()){
   const form=f.saveForm();form.set('eventType',eventType);form.set('templateId','celebration-v1');form.set('accent',accent);form.set('contentVersion',String(index));
   assert.equal((await f.actions.updateEvent('event',form)).ok,true);
   const saved=f.state.events.get('event');assert.equal(saved.accent,accent);
   const reopened=initialGuidedValues(saved);assert.equal(reopened.accent,accent);
   const style=atmosphereStyle(reopened.accent);
   assert.equal(style['--wa-base'],paletteFromAccent(accent).dark);
   assert.equal(style['--wa-tint'],accent);
  }
 }
});

test('image extraction retains a light, dark and three accents from a five-tone reference',()=>{
 const f=createFixture();const {imagePaletteFromPixels}=f.load('lib/invitation-palettes.ts');
 const {isInvitationImagePalette,imagePaletteColors}=f.load('lib/invitation-image-palette.ts');
 const colors=['#F2E7C4','#593203','#F28A2E','#F26E22','#F2B950'];
 const pixels=colors.flatMap((color,index)=>Array.from({length:[600,20,150,130,100][index]},()=>[1,3,5].map(offset=>parseInt(color.slice(offset,offset+2),16)).concat(255)).flat());
 const result=imagePaletteFromPixels(pixels);
 assert.equal(isInvitationImagePalette(result),true);
 assert.equal(result.light,'#f2e7c4');assert.equal(result.dark,'#593203');
 assert.deepEqual(new Set(imagePaletteColors(result)),new Set(colors.map(color=>color.toLowerCase())));
 const ignored=[...pixels,0,0,255,0];
 assert.deepEqual(imagePaletteFromPixels(ignored),result);
 assert.throws(()=>imagePaletteFromPixels([255,0,0,0]));
 for(const rgb of [[255,255,255],[0,0,0],[128,128,128],[242,110,34]]) {
  const palette=imagePaletteFromPixels([...rgb,255,...rgb,255]);
  assert.equal(isInvitationImagePalette(palette),true,JSON.stringify(palette));
 }
});

test('full image palettes persist, control background and text, and publish without losing source tones',async()=>{
 const f=createFixture();
 const palette={light:'#F2E7C4',dark:'#593203',accents:['#F28A2E','#F26E22','#F2B950']};
 const {initialGuidedValues}=f.load('lib/guided-invitation.ts');
 const {atmosphereStyle}=f.load('lib/invitation-atmosphere.ts');
 const {invitationTextColor}=f.load('lib/invitation-text-color.ts');
 const {showcaseContent}=f.load('lib/showcase.ts');
 const {showcaseStyleData}=f.load('lib/showcase-style.ts');
 for(const accent of [palette.light,palette.dark,...palette.accents]) {
  const form=f.saveForm();form.set('accent',accent);form.set('imagePalette',JSON.stringify(palette));
  assert.equal((await f.actions.updateEvent('event',form)).ok,true);
  const event=f.state.events.get('event');
  const reopened=initialGuidedValues(event);
  assert.deepEqual(reopened.imagePalette,palette);
  assert.equal(atmosphereStyle(accent,reopened)['--wa-base'],accent);
  const published=showcaseContent(event);
  assert.deepEqual(published.imagePalette,palette);
  assert.deepEqual(showcaseStyleData(published).imagePalette,palette);
  for(const tone of [palette.light,palette.dark,...palette.accents])assert.equal(invitationTextColor(accent,'palette',tone,palette),tone);
 }
 assert.equal(invitationTextColor(palette.light,'opposite',undefined,palette),palette.dark);
 assert.equal(invitationTextColor(palette.dark,'opposite',undefined,palette),palette.light);
 assert.equal(invitationTextColor(palette.light,'palette',undefined,palette),palette.dark);
 const legacy=f.saveForm();assert.equal((await f.actions.updateEvent('event',legacy)).ok,true);
 assert.deepEqual(f.state.events.get('event').imagePalette,palette);
 const clear=f.saveForm();clear.set('imagePalette','null');
 assert.equal((await f.actions.updateEvent('event',clear)).ok,true);assert.equal(f.state.events.get('event').imagePalette,null);
 for(const invalid of ['not-json',JSON.stringify({...palette,accents:['#ffffff']}),JSON.stringify({...palette,dark:'url(x)'}),JSON.stringify({...palette,light:palette.dark})]) {
  const form=f.saveForm();form.set('imagePalette',invalid);
  const before=structuredClone(f.state.events.get('event'));
  assert.equal((await f.actions.updateEvent('event',form)).code,'validation');
  assert.deepEqual(f.state.events.get('event'),before);
 }
});

test('the browser image sampler returns the complete five-tone palette instead of one dominant color',async()=>{
 const originalWindow=global.window,originalDocument=global.document;
 const colors=['#F2E7C4','#593203','#F28A2E','#F26E22','#F2B950'];
 const pixels=colors.flatMap(color=>[1,3,5].map(offset=>parseInt(color.slice(offset,offset+2),16)).concat(255));
 class ImageMock {
  naturalWidth=100;naturalHeight=100;
  set src(value){this.source=value;queueMicrotask(()=>this.onload?.());}
 }
 global.window={Image:ImageMock,setTimeout,clearTimeout};
 global.document={createElement:()=>({getContext:()=>({drawImage(){},getImageData:()=>({data:Uint8ClampedArray.from(pixels)})})})};
 try {
  const f=createFixture();const {extractBackgroundPalette}=f.load('lib/invitation-palettes.ts');
  const extracted=await extractBackgroundPalette('blob:local-selected-image');
  assert.equal(extracted.colors.light,'#f2e7c4');assert.equal(extracted.colors.dark,'#593203');
  assert.deepEqual(new Set([extracted.colors.light,extracted.colors.dark,...extracted.colors.accents]),new Set(colors.map(color=>color.toLowerCase())));
 } finally {
  if(originalWindow===undefined)delete global.window;else global.window=originalWindow;
  if(originalDocument===undefined)delete global.document;else global.document=originalDocument;
 }
});
