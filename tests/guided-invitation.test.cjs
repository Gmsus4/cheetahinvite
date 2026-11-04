/* eslint-disable @typescript-eslint/no-require-imports -- Exercise shared editor defaults and real server actions. */
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {randomUUID}=require('node:crypto');
const {createFixture}=require('./helpers/cloudinary-fixture.cjs');
function setup(){const f=createFixture();return {f,...f.load('lib/guided-invitation.ts')};}
test('every occasion starts with the same guided model without fictional facts',()=>{
 const {initialGuidedValues,guidedDetails}=setup();
 for(const eventType of ['wedding','birthday','graduation','baby_shower','anniversary','other']){
  const v=initialGuidedValues({id:'',eventType,name:'',accent:'#e9560a',sections:[]});
  assert.equal(v.eventType,eventType);assert.ok(v.name);assert.equal(v.hostNames,'');assert.equal(v.eventDate,'');assert.equal(v.venue,'');
  assert.ok(v.sections.every(s=>!s.content&&!s.detail&&!s.link));
  assert.equal(v.sections.filter(s=>s.enabled).length,1);
  assert.ok(guidedDetails(eventType).some(s=>s.type==='rsvp'));
  if(eventType==='birthday')assert.equal(v.templateId,'birthday-confetti-v1');
 }
});
test('existing birthday content, layout and enabled sections survive opening and design changes',()=>{
 const {initialGuidedValues,applyGuidedDesign}=setup();
 const old={id:'event',eventType:'birthday',templateId:'none',name:'Mi fiesta',hostNames:'Alex',accent:'#123456',typography:'inter',bodyTypography:'nunito',sections:[{id:'own',type:'custom',title:'Mi título',content:'Mi contenido',detail:'',link:'',imageUrl:'',enabled:true}]};
 const initial=initialGuidedValues(old);assert.equal(initial.accent,old.accent);assert.equal(initial.templateId,'none');assert.deepEqual(initial.sections[0],old.sections[0]);
 const changed=applyGuidedDesign(initial,'birthday-confetti-v1');assert.equal(changed.hostNames,'Alex');assert.equal(changed.name,'Mi fiesta');assert.deepEqual(changed.sections,initial.sections);assert.equal(changed.eventType,'birthday');
});
test('every occasion validates required details and external confirmation links',()=>{
 const {guidedPublicationIssues,guidedSections}=setup();
 for(const eventType of ['wedding','birthday','graduation','baby_shower','anniversary','other']){
  const v={eventType,hostNames:'Alex',eventDate:'2027-01-15',eventTime:'17:00',venue:'Salón',address:'Calle y ciudad',sections:guidedSections(eventType)};
  assert.deepEqual(guidedPublicationIssues(v),[]);
  assert.equal(guidedPublicationIssues({...v,hostNames:''}).length,1);
  const rsvp=v.sections.find(s=>s.type==='rsvp');rsvp.rsvpMode='external';assert.equal(guidedPublicationIssues(v).length,1);
  rsvp.link='https://example.com/confirmar';assert.deepEqual(guidedPublicationIssues(v),[]);
 }
});
test('Confeti is retained during preparation and incomplete birthdays cannot proceed to payment',async()=>{
 const {f,guidedSections}=setup();const form=f.saveForm();const key=randomUUID();
 form.set('eventType','birthday');form.set('templateId','birthday-confetti-v1');form.set('creationKey',key);
 assert.equal((await f.load('app/crear/actions.ts').prepareEvent(form)).ok,true);
 assert.equal(f.state.events.get(key).templateId,'birthday-confetti-v1');
 Object.assign(f.state.events.get('event'),{eventType:'birthday',templateId:'birthday-confetti-v1',sections:guidedSections('birthday')});
 assert.equal((await f.actions.publishEvent('event',0)).code,'validation');
 Object.assign(f.state.events.get('event'),{hostNames:'Alex',eventDate:new Date('2027-01-15T12:00:00Z'),eventTime:'17:00',venue:'Salón',address:'Calle'});
 assert.equal((await f.actions.publishEvent('event',0)).ok,true);
});

test('legacy external RSVP remains external when opened in the shared editor',()=>{
 const {initialGuidedValues}=setup();
 const values=initialGuidedValues({id:'old',eventType:'birthday',templateId:'none',name:'Fiesta',accent:'#123456',sections:[{id:'reply',type:'rsvp',title:'Confirma',content:'',detail:'',link:'https://example.com/confirmar',imageUrl:'',enabled:true}]});
 assert.equal(values.sections[0].rsvpMode,'external');
 assert.equal(values.sections[0].link,'https://example.com/confirmar');
});

test('Globos pastel retains personal data, publishes its nineteen assets and survives draft preparation', async()=>{
 const {f,applyGuidedDesign}=setup();
 const {birthdayPastelId,birthdayPastelAssets}=f.load('lib/birthday-pastel.ts');
 const {isInvitationTemplate}=f.load('lib/invitation-templates.ts');
 const fs=require('node:fs'),path=require('node:path');
 assert.equal(isInvitationTemplate('birthday',birthdayPastelId),true);
 assert.equal(isInvitationTemplate('wedding',birthdayPastelId),false);
 assert.equal(birthdayPastelAssets.length,19);
 for(const asset of birthdayPastelAssets) assert.ok(fs.existsSync(path.join(__dirname,'../public/birthday/pastel',asset+'.webp')));
 const before={eventType:'birthday',name:'Mi fiesta',hostNames:'Alex',imageUrl:'https://example.com/photo.jpg',message:'Un mensaje propio',sections:[],templateId:'birthday-confetti-v1'};
 const after=applyGuidedDesign(before,birthdayPastelId);
 for(const key of ['name','hostNames','imageUrl','message','sections'])assert.deepEqual(after[key],before[key]);
 assert.equal(after.typography,'comfortaa');assert.equal(after.templateId,birthdayPastelId);
 const key=randomUUID(),form=f.saveForm();form.set('eventType','birthday');form.set('templateId',birthdayPastelId);form.set('creationKey',key);
 assert.equal((await f.load('app/crear/actions.ts').prepareEvent(form)).ok,true);
 assert.equal(f.state.events.get(key).templateId,birthdayPastelId);
 form.set('templateId',birthdayPastelId);assert.equal((await f.actions.updateEvent('event',form)).ok,true);
 assert.equal(f.state.events.get('event').templateId,birthdayPastelId);
});

test('Neón keeps its identity through saving and preserves personal content when selected',async()=>{
 const {f,applyGuidedDesign}=setup();
 const {birthdayNeonId,birthdayNeonAssets}=f.load('lib/birthday-neon.ts');
 const {isInvitationTemplate}=f.load('lib/invitation-templates.ts');
 const fs=require('node:fs'),path=require('node:path');
 assert.equal(isInvitationTemplate('birthday',birthdayNeonId),true);
 assert.equal(isInvitationTemplate('wedding',birthdayNeonId),false);
 assert.equal(birthdayNeonAssets.length,7);
 for(const asset of birthdayNeonAssets)assert.ok(fs.existsSync(path.join(__dirname,'../public/birthday/neon',asset+'.webp')));
 const input={eventType:'birthday',name:'Mi celebración',hostNames:'Alex',eventDate:'2027-11-10',message:'Mensaje propio',imageUrl:'https://example.com/photo.jpg',sections:[{id:'story',type:'story',title:'Mi historia',content:'Mis palabras',enabled:true}]};
 const selected=applyGuidedDesign(input,birthdayNeonId);
 for(const key of ['name','hostNames','eventDate','message','imageUrl','sections'])assert.deepEqual(selected[key],input[key]);
 assert.equal(selected.typography,'comfortaa');assert.equal(selected.bodyTypography,'dm-sans');
 const key=randomUUID(),form=f.saveForm();form.set('eventType','birthday');form.set('templateId',birthdayNeonId);form.set('creationKey',key);
 assert.equal((await f.load('app/crear/actions.ts').prepareEvent(form)).ok,true);
 assert.equal(f.state.events.get(key).templateId,birthdayNeonId);
 assert.equal((await f.actions.updateEvent('event',form)).ok,true);
 assert.equal(f.state.events.get('event').templateId,birthdayNeonId);
});

test('Disco registers thirteen assets, preserves personal content and survives preparation and saving',async()=>{
 const {f,applyGuidedDesign}=setup();
 const {birthdayDiscoId,birthdayDiscoAssets}=f.load('lib/birthday-disco.ts');
 const {isInvitationTemplate}=f.load('lib/invitation-templates.ts');
 const fs=require('node:fs'),path=require('node:path');
 assert.equal(isInvitationTemplate('birthday',birthdayDiscoId),true);assert.equal(isInvitationTemplate('wedding',birthdayDiscoId),false);
 assert.equal(birthdayDiscoAssets.length,13);
 for(const asset of birthdayDiscoAssets)assert.ok(fs.existsSync(path.join(__dirname,'../public/birthday/disco',asset+'.webp')));
 const input={eventType:'birthday',name:'Fiesta propia',hostNames:'Alex',eventDate:'2027-08-12',message:'Mi mensaje',imageUrl:'https://example.com/photo.jpg',sections:[{id:'my-section',type:'custom',title:'Mi sección',content:'Información propia',enabled:true}]};
 const selected=applyGuidedDesign(input,birthdayDiscoId);
 for(const key of ['name','hostNames','eventDate','message','imageUrl','sections'])assert.deepEqual(selected[key],input[key]);
 assert.equal(selected.typography,'outfit');assert.equal(selected.bodyTypography,'dm-sans');
 const key=randomUUID(),form=f.saveForm();form.set('eventType','birthday');form.set('templateId',birthdayDiscoId);form.set('creationKey',key);
 assert.equal((await f.load('app/crear/actions.ts').prepareEvent(form)).ok,true);assert.equal(f.state.events.get(key).templateId,birthdayDiscoId);
 assert.equal((await f.actions.updateEvent('event',form)).ok,true);assert.equal(f.state.events.get('event').templateId,birthdayDiscoId);
});

test('Dinosaur registers sixteen assets, preserves personal content and survives preparation and saving',async()=>{
 const {f,applyGuidedDesign}=setup();
 const {birthdayDinosaurId,birthdayDinosaurAssets}=f.load('lib/birthday-dinosaur.ts');
 const {isInvitationTemplate}=f.load('lib/invitation-templates.ts');
 const fs=require('node:fs'),path=require('node:path');
 assert.equal(isInvitationTemplate('birthday',birthdayDinosaurId),true);assert.equal(isInvitationTemplate('wedding',birthdayDinosaurId),false);
 assert.equal(birthdayDinosaurAssets.length,16);
 for(const asset of birthdayDinosaurAssets)assert.ok(fs.existsSync(path.join(__dirname,'../public/birthday/dinosaur',asset+'.webp')));
 const input={eventType:'birthday',name:'Fiesta propia',hostNames:'Alex',eventDate:'2027-08-12',message:'Mi mensaje',imageUrl:'https://example.com/photo.jpg',sections:[{id:'my-section',type:'custom',title:'Mi sección',content:'Información propia',enabled:true}]};
 const selected=applyGuidedDesign(input,birthdayDinosaurId);
 for(const key of ['name','hostNames','eventDate','message','imageUrl','sections'])assert.deepEqual(selected[key],input[key]);
 assert.equal(selected.typography,'fredoka');assert.equal(selected.bodyTypography,'nunito');
 const key=randomUUID(),form=f.saveForm();form.set('eventType','birthday');form.set('templateId',birthdayDinosaurId);form.set('creationKey',key);
 assert.equal((await f.load('app/crear/actions.ts').prepareEvent(form)).ok,true);assert.equal(f.state.events.get(key).templateId,birthdayDinosaurId);
 assert.equal((await f.actions.updateEvent('event',form)).ok,true);assert.equal(f.state.events.get('event').templateId,birthdayDinosaurId);
});
