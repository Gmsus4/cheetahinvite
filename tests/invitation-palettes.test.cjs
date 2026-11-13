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
 global.document={createElement:()=>({getContext:()=>({drawImage(){assert.equal(this.imageSmoothingEnabled,false);},getImageData:()=>({data:Uint8ClampedArray.from(pixels)})})})};
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


test('perceptual sampling keeps warm accents instead of extra cream shades and white highlights',()=>{
 const {imagePaletteFromPixels}=createFixture().load('lib/invitation-palettes.ts');
 const histogram=[['#4b2d09',8],['#faf6f2',95],['#f26e22',139],['#f4c453',206],['#f9edc6',2384],['#593203',76],['#ecd29c',198],['#f2942d',78],['#c45d21',27],['#ebac7c',74],['#f5d273',226],['#f4e3b4',305],['#edac4b',102],['#f3bc7b',154],['#eb8344',108],['#f2ba51',284]];
 const pixels=histogram.flatMap(([color,count])=>Array.from({length:count},()=>[1,3,5].map(i=>parseInt(color.slice(i,i+2),16)).concat(255)).flat());
 const palette=imagePaletteFromPixels(pixels);
 const rgb=color=>[1,3,5].map(i=>parseInt(color.slice(i,i+2),16));
 const difference=(a,b)=>Math.hypot(...rgb(a).map((v,i)=>v-rgb(b)[i]));
 assert.ok(difference(palette.light,'#F2E7C4')<22);
 assert.ok(difference(palette.dark,'#593203')<25);
 for(const expected of ['#F2B950','#F28A2E','#F26E22']) assert.ok(palette.accents.some(color=>difference(color,expected)<22),expected+': '+JSON.stringify(palette));
});

test('block colors persist through saves, public snapshots and global overrides without erasing individual choices',async()=>{
 const f=createFixture();
 const {initialGuidedValues}=f.load('lib/guided-invitation.ts');
 const {showcaseContent}=f.load('lib/showcase.ts');
 const {showcaseStyleData}=f.load('lib/showcase-style.ts');
 const {atmosphereTextStyle}=f.load('lib/invitation-atmosphere.ts');
 const blocks=['#F2B950','#F28A2E'].map((sectionColor,index)=>({id:'color-'+index,type:'custom',title:'Bloque',content:'Contenido',detail:'',link:'',imageUrl:'',enabled:true,sectionColor}));
 for(const sectionColor of ['auto','#F26E22','auto']) {
  const form=f.saveForm('',blocks);form.set('sectionColor',sectionColor);
  assert.equal((await f.actions.updateEvent('event',form)).ok,true);
  const event=f.state.events.get('event');
  const reopened=initialGuidedValues(event),published=showcaseContent(event);
  assert.equal(reopened.sectionColor,sectionColor);
  assert.equal(showcaseStyleData(published).sectionColor,sectionColor);
  assert.deepEqual(published.sections.map(s=>s.sectionColor),blocks.map(s=>s.sectionColor));
  for(const block of blocks) assert.equal(atmosphereTextStyle('#58664E',reopened,block)['--wa-base'],sectionColor==='auto'?block.sectionColor:sectionColor);
 }
 assert.equal(atmosphereTextStyle('#58664E',{sectionColor:'auto'},{} )['--wa-base'],undefined);
 const legacy=f.saveForm('',blocks);assert.equal((await f.actions.updateEvent('event',legacy)).ok,true);
 assert.equal(f.state.events.get('event').sectionColor,'auto');
 for(const invalid of ['red','#fff','url(x)',null]) {
  const form=f.saveForm('',[{...blocks[0],sectionColor:invalid}]);
  assert.equal((await f.actions.updateEvent('event',form)).code,'validation');
 }
 for(const invalid of ['red','#fff','url(x)']) {
  const form=f.saveForm('',blocks);form.set('sectionColor',invalid);
  assert.equal((await f.actions.updateEvent('event',form)).code,'validation');
 }
});


test('small dark details survive population filtering, while isolated black noise does not replace them',()=>{
 const {imagePaletteFromPixels}=createFixture().load('lib/invitation-palettes.ts');
 const pixelsFrom=histogram=>histogram.flatMap(([color,count])=>Array.from({length:count},()=>[1,3,5].map(i=>parseInt(color.slice(i,i+2),16)).concat(255)).flat());
 const warm=[['#F2E7C4',6000],['#F28A2E',1500],['#F26E22',1400],['#F2B950',1100]];
 for(const dark of ['#593203','#123458','#173a20']) {
  const pixels=[...pixelsFrom([...warm,[dark,2]]),0,0,0,255,0,0,0,0];
  const palette=imagePaletteFromPixels(pixels);
  assert.equal(palette.dark,dark);
  assert.equal(palette.light,'#f2e7c4');
 }
 // Compression can spread a tiny outline across adjacent histogram buckets.
 const compressed=imagePaletteFromPixels(pixelsFrom([...warm,['#573003',1],['#593203',1],['#5b3405',1]]));
 assert.equal(compressed.dark,'#573003');
});

test('images without a dark tone gain a contrasting shade of their own hue',()=>{
 const f=createFixture();
 const {imagePaletteFromPixels}=f.load('lib/invitation-palettes.ts');
 const {textContrastRatio}=f.load('lib/invitation-text-color.ts');
 const {isInvitationImagePalette}=f.load('lib/invitation-image-palette.ts');
 const rgb=color=>[1,3,5].map(i=>parseInt(color.slice(i,i+2),16));
 const sample=colors=>colors.flatMap(color=>Array.from({length:100},()=>rgb(color).concat(255)).flat());
 const warm=imagePaletteFromPixels(sample(['#F2E7C4','#F2B950','#F28A2E','#F26E22']));
 assert.equal(isInvitationImagePalette(warm),true);
 assert.ok(textContrastRatio(warm.dark,'#F2E7C4')>=4.5);
 assert.ok(textContrastRatio(warm.dark,'#F2B950')>=4.5);
 const shade=rgb(warm.dark),source=rgb('#F26E22');
 const scale=shade[0]/source[0];
 assert.ok(shade[0]>shade[1]&&shade[1]>shade[2]);
 source.forEach((channel,index)=>assert.ok(Math.abs(shade[index]-channel*scale)<=1));
 const blue=imagePaletteFromPixels(sample(['#e7f1fa','#add5f4','#8fbfea']));
 const green=imagePaletteFromPixels(sample(['#e7f5dd','#c4dd9e','#a2bd73']));
 assert.ok(rgb(blue.dark)[2]>rgb(blue.dark)[0]);
 assert.ok(rgb(green.dark)[1]>rgb(green.dark)[0]);
 assert.notEqual(blue.dark,green.dark);
 assert.ok(textContrastRatio(blue.dark,blue.light)>=4.5);
 assert.ok(textContrastRatio(green.dark,green.light)>=4.5);
 assert.equal(isInvitationImagePalette(blue),true);
 assert.equal(isInvitationImagePalette(green),true);
});


test('block palette targets follow every replacement palette while fixed colors stay fixed',()=>{
 const f=createFixture();
 const {imagePaletteTargets,resolveInvitationSectionColor,invitationSectionPaletteTarget,isInvitationSectionColor}=f.load('lib/invitation-image-palette.ts');
 const {invitationPaletteChanges}=f.load('lib/invitation-palette-selection.ts');
 const {atmosphereTextStyle}=f.load('lib/invitation-atmosphere.ts');
 const previous={light:'#F2E7C4',dark:'#593203',accents:['#F2B950','#F28A2E','#F26E22']};
 const next={light:'#e7f1fa',dark:'#123458',accents:['#8fbfea','#5084c2','#acdcf0']};
 const oldColors=[previous.light,previous.dark,...previous.accents];
 const newColors=[next.light,next.dark,...next.accents];
 const sections=oldColors.map((sectionColor,index)=>({id:'block-'+index,type:'custom',title:'Bloque',content:'Texto',detail:'',link:'',imageUrl:'',enabled:true,sectionColor}));
 sections.push({...sections[0],id:'fixed',sectionColor:'custom:'+previous.light},{...sections[0],id:'legacy-custom',sectionColor:'#123456'},{...sections[0],id:'default',sectionColor:'auto'});
 const values={imagePalette:previous,sectionColor:previous.dark,sections};
 const changed=invitationPaletteChanges(values,next.accents[0],next);
 assert.equal(changed.sectionColor,'palette:dark');
 assert.deepEqual(changed.sections.slice(0,5).map(section=>section.sectionColor),imagePaletteTargets);
 changed.sections.slice(0,5).forEach((section,index)=>{
  assert.equal(resolveInvitationSectionColor(section.sectionColor,next),newColors[index]);
  assert.equal(invitationSectionPaletteTarget(section.sectionColor,next),imagePaletteTargets[index]);
  assert.equal(atmosphereTextStyle(next.accents[0],{...changed,sectionColor:'auto'},section)['--wa-base'],newColors[index]);
  assert.equal(atmosphereTextStyle(next.accents[0],changed,section)['--wa-base'],next.dark);
 });
 assert.equal(resolveInvitationSectionColor(changed.sections[5].sectionColor,next),previous.light);
 assert.equal(invitationSectionPaletteTarget(changed.sections[5].sectionColor,next),undefined);
 assert.equal(changed.sections[6].sectionColor,'custom:#123456');
 const collision={...next,accents:['#123456',next.accents[1],next.accents[2]]};
 assert.equal(invitationSectionPaletteTarget(changed.sections[6].sectionColor,collision),undefined);
 assert.equal(changed.sections[7].sectionColor,'auto');
 assert.deepEqual(values.sections.slice(0,5).map(section=>section.sectionColor),oldColors);
 const again=invitationPaletteChanges(changed,previous.accents[0],previous,'auto');
 assert.deepEqual(again.sections.slice(0,5).map(section=>resolveInvitationSectionColor(section.sectionColor,previous)),oldColors);
 assert.equal(again.sectionColor,'auto');
 for(const target of imagePaletteTargets) {
  assert.equal(isInvitationSectionColor(target),true);
  assert.equal(resolveInvitationSectionColor(target,null),undefined);
  assert.equal(invitationSectionPaletteTarget(target,null),target);
 }
 for(const invalid of ['palette:accent-4','palette:5','palette:__proto__','custom:red','custom:#fff','custom:#FFFFFF;display:none'])assert.equal(isInvitationSectionColor(invalid),false);
});

test('palette targets survive saving, reopening and publishing with the current palette',async()=>{
 const f=createFixture();
 const {imagePaletteTargets}=f.load('lib/invitation-image-palette.ts');
 const {initialGuidedValues}=f.load('lib/guided-invitation.ts');
 const {showcaseContent}=f.load('lib/showcase.ts');
 const {showcaseStyleData}=f.load('lib/showcase-style.ts');
 const {atmosphereTextStyle}=f.load('lib/invitation-atmosphere.ts');
 const palette={light:'#e7f1fa',dark:'#123458',accents:['#8fbfea','#5084c2','#acdcf0']};
 const colors=[palette.light,palette.dark,...palette.accents];
 const sections=imagePaletteTargets.map((sectionColor,index)=>({id:'target-'+index,type:'custom',title:'Bloque',content:'Texto',detail:'',link:'',imageUrl:'',enabled:true,sectionColor}));
 sections.push({...sections[0],id:'custom',sectionColor:'custom:#F2E7C4'});
 for(const sectionColor of ['auto','palette:dark','custom:#112233','auto']) {
  const form=f.saveForm('',sections);form.set('imagePalette',JSON.stringify(palette));form.set('sectionColor',sectionColor);
  assert.equal((await f.actions.updateEvent('event',form)).ok,true);
  const event=f.state.events.get('event');
  const reopened=initialGuidedValues(event),published=showcaseContent(event),copy=showcaseStyleData(published);
  assert.equal(reopened.sectionColor,sectionColor);
  assert.equal(copy.sectionColor,sectionColor);
  assert.deepEqual(published.sections.map(section=>section.sectionColor),sections.map(section=>section.sectionColor));
  const personal={...reopened,sectionColor:'auto'};
  sections.slice(0,5).forEach((section,index)=>assert.equal(atmosphereTextStyle(published.accent,personal,section)['--wa-base'],colors[index]));
 }
 for(const invalid of ['palette:accent-4','palette:5','palette:__proto__','custom:red','custom:#fff','custom:#FFFFFF;display:none']) {
  const global=f.saveForm('',sections);global.set('sectionColor',invalid);
  assert.equal((await f.actions.updateEvent('event',global)).code,'validation');
  const perBlock=f.saveForm('',[{...sections[0],sectionColor:invalid}]);
  assert.equal((await f.actions.updateEvent('event',perBlock)).code,'validation');
 }
});
