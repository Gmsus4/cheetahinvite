/* eslint-disable @typescript-eslint/no-require-imports -- Verify installed fonts, recommendations and real saves. */
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {createFixture}=require('./helpers/cloudinary-fixture.cjs');
const occasions=['wedding','birthday','graduation','baby_shower','anniversary','other'];
test('every installed font is selectable for both roles and recommendations vary by occasion',()=>{
 const f=createFixture();const {invitationFonts,recommendedInvitationFonts}=f.load('lib/invitation-fonts.ts');
 const pkg=JSON.parse(fs.readFileSync(path.join(__dirname,'../package.json'),'utf8'));
 for(const name of Object.keys(pkg.dependencies).filter(name=>name.startsWith('@fontsource'))){
  const id=name.split('/')[1];assert.ok(invitationFonts.some(font=>font.id===id),id);
 }
 for(const eventType of occasions)for(const role of ['heading','body']){
  const recommended=recommendedInvitationFonts(eventType,role);assert.ok(recommended.length);
  assert.ok(recommended.every(id=>invitationFonts.some(font=>font.id===id)));
 }
 assert.notDeepEqual(recommendedInvitationFonts('wedding','heading'),recommendedInvitationFonts('birthday','heading'));
 assert.notDeepEqual(recommendedInvitationFonts('graduation','heading'),recommendedInvitationFonts('baby_shower','heading'));
});
test('all font selections survive server saving and reopening in the shared invitation',async()=>{
 const f=createFixture();const {invitationFonts}=f.load('lib/invitation-fonts.ts');
 const {initialGuidedValues}=f.load('lib/guided-invitation.ts');
 for(let i=0;i<invitationFonts.length;i++){
  const typography=invitationFonts[i].id;const bodyTypography=invitationFonts[(i+5)%invitationFonts.length].id;
  const form=f.saveForm();form.set('contentVersion',String(i));form.set('templateId','celebration-v1');
  form.set('eventType',occasions[i%occasions.length]);form.set('typography',typography);form.set('bodyTypography',bodyTypography);
  assert.equal((await f.actions.updateEvent('event',form)).ok,true,typography);
  const saved=f.state.events.get('event');const reopened=initialGuidedValues(saved);
  for(const values of [saved,reopened]){assert.equal(values.typography,typography);assert.equal(values.bodyTypography,bodyTypography);}
 }
});
test('saved legacy wedding fonts survive opening and rendering uses the selected fonts independently',()=>{
 const f=createFixture();const {initialGuidedValues}=f.load('lib/guided-invitation.ts');
 const {weddingDesigns}=f.load('lib/wedding-designs.ts');const {atmosphereStyle}=f.load('lib/wedding-atmosphere.ts');
 const {getInvitationFont}=f.load('lib/invitation-fonts.ts');
 const values=initialGuidedValues({id:'saved',eventType:'wedding',templateId:weddingDesigns[0].id,typography:'fredoka',bodyTypography:'manrope',sections:[]});
 assert.equal(values.typography,'fredoka');assert.equal(values.bodyTypography,'manrope');
 const style=atmosphereStyle(weddingDesigns[0],weddingDesigns[0].palettes[0].accent,values);
 assert.equal(style['--wa-heading'],getInvitationFont('fredoka').family);
 assert.equal(style['--wa-body'],getInvitationFont('manrope').family);
});
