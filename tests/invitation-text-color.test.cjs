/* eslint-disable @typescript-eslint/no-require-imports -- Exercise color math and persistence without external services. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createFixture } = require('./helpers/cloudinary-fixture.cjs');

test('text colors follow their mode and the active palette while contrast uses linear sRGB', () => {
  const f = createFixture();
  const { invitationTextColor, textContrastRatio, invitationTextContrast, blendTextBackground } = f.load('lib/invitation-text-color.ts');
  assert.equal(invitationTextColor('#58664E', 'black'), '#000000');
  assert.equal(invitationTextColor('#58664E', 'white'), '#FFFFFF');
  for (const accent of ['#58664E', '#925C65']) assert.equal(invitationTextColor(accent, 'palette'), accent);
  assert.equal(invitationTextColor('#58664E', 'custom', '#F0A123'), '#F0A123');
  assert.equal(invitationTextColor('#58664E', 'custom', 'red'), '#FFFFFF');
  assert.equal(textContrastRatio('#000000', '#FFFFFF'), 21);
  assert.equal(textContrastRatio('#FFFFFF', '#000000'), 21);
  assert.equal(textContrastRatio('#123456', '#123456'), 1);
  assert.ok(Math.abs(textContrastRatio('#777777', '#FFFFFF') - 4.478089) < 0.00001);
  assert.equal(blendTextBackground('#000000', '#FFFFFF', 0.5), '#808080');
  assert.equal(invitationTextContrast('#FFFFFF', '#58664E', 0, ['#FFFFFF']), 1);
  assert.ok(invitationTextContrast('#FFFFFF', '#58664E', 100, ['#FFFFFF']) >= 4.5);
  assert.ok(invitationTextContrast('#000000', '#58664E', 0) < 4.5);
});

test('global text color survives normal saves, partial legacy saves, style adoption and public snapshots', async () => {
  const f = createFixture();
  const { initialGuidedValues } = f.load('lib/guided-invitation.ts');
  const { showcaseContent } = f.load('lib/showcase.ts');
  const { showcaseStyleData } = f.load('lib/showcase-style.ts');
  for (const textColorMode of ['black', 'white', 'palette', 'custom']) {
    const form = f.saveForm(); form.set('textColorMode', textColorMode); form.set('textColor', '#9BA123');
    assert.equal((await f.actions.updateEvent('event', form)).ok, true);
    const event = f.state.events.get('event');
    const reopened = initialGuidedValues(event);
    assert.equal(reopened.textColorMode, textColorMode);
    assert.equal(reopened.textColor, '#9BA123');
    const published = showcaseContent(event);
    assert.equal(published.textColorMode, textColorMode);
    const copied = showcaseStyleData(published);
    assert.equal(copied.textColorMode, textColorMode);
    assert.equal(copied.textColor, '#9BA123');
  }
  assert.equal((await f.actions.updateEvent('event', f.saveForm())).ok, true);
  assert.equal(f.state.events.get('event').textColorMode, 'custom');
  for (const [field, value] of [['textColorMode', 'invalid'], ['textColorMode', ''], ['textColor', 'red'], ['textColor', '#fff'], ['textColor', '#FFFFFF;display:none']]) {
    const form = f.saveForm(); form.set(field, value);
    const before = structuredClone(f.state.events.get('event'));
    assert.equal((await f.actions.updateEvent('event', form)).code, 'validation');
    assert.deepEqual(f.state.events.get('event'), before);
  }
});

test('default text stays ivory white while per-section colors yield to explicit global colors', () => {
  const f=createFixture();
  const {oppositePaletteColor,isGlobalTextColorLocked,invitationTextColor}=f.load('lib/invitation-text-color.ts');
  const {atmosphereTextStyle}=f.load('lib/invitation-atmosphere.ts');
  const section={textColorMode:'custom',textColor:'#123456'};
  assert.equal(invitationTextColor('#58664E','auto'),'#fffaf2');
  assert.ok(f.load('lib/invitation-text-color.ts').textContrastRatio(oppositePaletteColor('#ff0000'),'#ff0000')>=4.5);
  assert.ok(f.load('lib/invitation-text-color.ts').textContrastRatio(oppositePaletteColor('#58664E'),'#303D2D')>=4.5);
  assert.equal(isGlobalTextColorLocked(undefined),false);
  assert.equal(isGlobalTextColorLocked('auto'),false);
  assert.equal(atmosphereTextStyle('#58664E',{textColorMode:'auto'},section).color,'#123456');
  for(const textColorMode of ['white','black','palette','opposite','custom']) {
    assert.equal(isGlobalTextColorLocked(textColorMode),true);
    const global={textColorMode,textColor:'#ABCDEF'};
    assert.equal(atmosphereTextStyle('#58664E',global,section).color,invitationTextColor('#58664E',textColorMode,'#ABCDEF'));
  }
  assert.equal(atmosphereTextStyle('#58664E',{textColorMode:'auto'},section).color,'#123456');
  assert.deepEqual(section,{textColorMode:'custom',textColor:'#123456'});
  const legacy=atmosphereTextStyle('#58664E',{});
  assert.equal(legacy.color,'#fffaf2');assert.equal(legacy['--wa-soft'],'#eee7dc');
});

test('section text colors survive saving and public snapshots while a global override retains them',async()=>{
  const f=createFixture();
  const {initialGuidedValues}=f.load('lib/guided-invitation.ts');
  const {showcaseContent}=f.load('lib/showcase.ts');
  const sections=['auto','white','black','palette','opposite','custom'].map((textColorMode,index)=>({id:'section-'+index,type:'custom',title:'Apartado',content:'Contenido',detail:'',link:'',imageUrl:'',enabled:true,textColorMode,textColor:'#12AB34'}));
  for(const textColorMode of ['auto','black','auto']) {
    const form=f.saveForm('',sections);form.set('textColorMode',textColorMode);
    assert.equal((await f.actions.updateEvent('event',form)).ok,true);
    const event=f.state.events.get('event');
    assert.equal(initialGuidedValues(event).textColorMode,textColorMode);
    assert.deepEqual(initialGuidedValues(event).sections.filter(s=>s.type==='custom').map(s=>[s.textColorMode,s.textColor]),sections.map(s=>[s.textColorMode,s.textColor]));
    assert.deepEqual(showcaseContent(event).sections.map(s=>[s.textColorMode,s.textColor]),sections.map(s=>[s.textColorMode,s.textColor]));
  }
  for(const patch of [{textColorMode:'invalid'},{textColorMode:null},{textColor:'red'},{textColor:'#fff'},{textColor:null}]) {
    const form=f.saveForm('',[{...sections[0],...patch}]);
    assert.equal((await f.actions.updateEvent('event',form)).code,'validation');
  }
});

test('palette contrast uses its own light or dark shade rather than a complementary hue',()=>{
  const f=createFixture();
  const {oppositePaletteColor,textContrastRatio}=f.load('lib/invitation-text-color.ts');
  const {sharedInvitationDesign,invitationPalette}=f.load('lib/shared-invitation.ts');
  assert.equal(oppositePaletteColor('#58664E'),invitationPalette('#58664E').paper);
  assert.equal(oppositePaletteColor('#ffff00'),invitationPalette('#ffff00').ink);
  assert.equal(oppositePaletteColor('#b8d8ff'),invitationPalette('#b8d8ff').ink);
  for(const accent of [...sharedInvitationDesign.palettes.map(p=>p.accent),'#000000','#FFFFFF','#ff0000','#00ff00','#0000ff','#808080','#ffeecc','#123c20']) {
    const result=oppositePaletteColor(accent);
    const palette=invitationPalette(accent);
    const light=textContrastRatio('#FFFFFF',palette.accent)>=textContrastRatio('#000000',palette.accent);
    const variant=light?palette.paper:palette.ink;
    assert.match(result,/^#[0-9a-f]{6}$/i);
    assert.ok(textContrastRatio(result,palette.accent)>=4.5,accent);
    if(textContrastRatio(variant,palette.accent)>=4.5)assert.equal(result,variant);
    const resultBrightness=textContrastRatio(result,'#000000');
    const accentBrightness=textContrastRatio(palette.accent,'#000000');
    assert.ok(light?resultBrightness>accentBrightness:resultBrightness<accentBrightness,accent);
  }
});
