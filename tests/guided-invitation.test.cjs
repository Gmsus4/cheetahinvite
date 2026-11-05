/* eslint-disable @typescript-eslint/no-require-imports -- Exercise shared editor defaults and real server actions. */
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {randomUUID}=require('node:crypto');
const {createFixture}=require('./helpers/cloudinary-fixture.cjs');
function setup(){const f=createFixture();return {f,...f.load('lib/guided-invitation.ts')};}
test('previous draft flows migrate to the gradual journey without losing the active detail',()=>{
 const {guidedRecoveryStep,guidedRecoverySection,guidedRecoveryAppearance}=setup();
 for(const [step,expected] of [[0,0],[1,0],[2,3],[3,5],[15,5]])assert.equal(guidedRecoveryStep({step,activeExtra:null}),expected);
 for(const [step,expected] of [[0,0],[1,2],[2,3],[3,4],[4,5]])assert.equal(guidedRecoveryStep({step,activeExtra:null,flow:'content-v2'}),expected);
 for(const [step,activeExtra,expected] of [[0,null,0],[1,null,2],[1,'photos',2],[1,'content',3],[1,'appearance',4],[2,null,5]])assert.equal(guidedRecoveryStep({step,activeExtra,flow:'content-v3'}),expected);
 const sections=[{id:'my-story',enabled:true},{id:'disabled',enabled:false}];
 for(let step=0;step<6;step++)assert.equal(guidedRecoveryStep({step,activeExtra:null,flow:'content-v4'}),step);
 assert.equal(guidedRecoveryStep({step:20,activeExtra:null,flow:'content-v4'}),5);
 assert.equal(guidedRecoverySection({step:3,activeExtra:'my-story',flow:'content-v4'},sections),'my-story');
 assert.equal(guidedRecoverySection({step:3,activeExtra:'disabled',flow:'content-v4'},sections),'disabled');
 assert.equal(guidedRecoverySection({step:3,activeExtra:'__more',flow:'content-v4'},sections),'__more');
 assert.equal(guidedRecoverySection({step:3,activeExtra:'__add:my-story',flow:'content-v4'},sections),'my-story');
 assert.equal(guidedRecoveryAppearance({step:4,activeExtra:'appearance-custom',flow:'content-v4'}),true);
 assert.equal(guidedRecoveryAppearance({step:1,activeExtra:'appearance',flow:'content-v3'}),true);
 assert.equal(guidedRecoveryAppearance({step:4,activeExtra:null,flow:'content-v4'}),false);
});

test('publication corrections lead to event data or details in the flow without design selection',()=>{
 const {guidedPublicationIssues,guidedSections}=setup();
 for(const eventType of ['wedding','birthday','graduation','baby_shower','anniversary','other']){
  const values={eventType,hostNames:'',eventDate:'',eventTime:'',venue:'',address:'',sections:guidedSections(eventType)};
  const missing=guidedPublicationIssues(values);
  assert.equal(missing.length,5);assert.deepEqual(missing.map(issue=>issue.step),[0,1,1,1,1]);
  const rsvp=values.sections.find(s=>s.type==='rsvp');rsvp.rsvpMode='external';
  assert.ok(guidedPublicationIssues(values).some(issue=>issue.step===3 && issue.sectionId===rsvp.id));
 }
});
test('every occasion starts with editable presets without fictional personal facts',()=>{
 const {initialGuidedValues,guidedDetails}=setup();
 for(const eventType of ['wedding','birthday','graduation','baby_shower','anniversary','other']){
  const v=initialGuidedValues({id:'',eventType,name:'',accent:'#e9560a',sections:[]});
  assert.equal(v.eventType,eventType);assert.ok(v.name);assert.equal(v.hostNames,'');assert.equal(v.eventDate,'');assert.equal(v.venue,'');
  assert.ok(v.message);
  assert.ok(v.sections.every(s=>!s.detail&&!s.link&&!s.imageUrl&&!s.imageUrls.length));
  assert.ok(v.sections.filter(s=>s.enabled).length>=4);
  assert.ok(v.sections.filter(s=>s.enabled).every(s=>s.content));
  assert.equal(v.sections.find(s=>s.type==='gallery').enabled,false);
  assert.equal(v.sections.find(s=>s.type==='ceremony').enabled,false);
  assert.ok(guidedDetails(eventType).some(s=>s.type==='rsvp'));
  assert.equal(v.templateId,'celebration-v1');assert.equal(v.texture,'none');
 }
});

test('occasion presets enable relevant sections and use distinct celebration copy',()=>{
 const {guidedSections}=setup();
 const active=type=>guidedSections(type).filter(s=>s.enabled).map(s=>s.type);
 assert.deepEqual(active('wedding'),['story','program','parents','gifts','rsvp']);
 assert.match(guidedSections('wedding').find(s=>s.type==='program').content,/Ceremonia/);
 assert.deepEqual(active('birthday'),['story','program','parents','gifts','rsvp']);
 assert.deepEqual(active('baby_shower'),['story','program','parents','gifts','rsvp']);
 assert.deepEqual(active('graduation'),['story','program','parents','rsvp']);
 assert.deepEqual(active('anniversary'),['story','program','parents','gifts','rsvp']);
 assert.deepEqual(active('other'),['story','program','parents','rsvp']);
 assert.match(guidedSections('birthday').find(s=>s.type==='program').content,/Pastel/);
 assert.match(guidedSections('baby_shower').find(s=>s.type==='gifts').content,/bebé/);
});

test('changing occasion replaces untouched presets while preserving user data, edits and photos',()=>{
 const {initialGuidedValues,changeGuidedEventType}=setup();
 const initial=initialGuidedValues({id:'',eventType:'birthday',name:'',sections:[]});
 const switched=changeGuidedEventType(initial,'baby_shower');
 assert.equal(switched.name,'Nuestro baby shower');
 assert.match(switched.message,/dulce espera/);
 assert.deepEqual(switched.sections.filter(s=>s.enabled).map(s=>s.type),['story','program','parents','gifts','rsvp']);
 const customized={...initial,name:'Mi fiesta propia',hostNames:'Alex',message:'Mis palabras',eventDate:'2027-01-15',venue:'Mi lugar',imageUrl:'https://example.com/cover.jpg',sections:initial.sections.map(s=>s.type==='story'?{...s,content:'Mi historia',imageUrl:'https://example.com/story.jpg'}:s.type==='rsvp'?{...s,enabled:false}:s)};
 const changed=changeGuidedEventType(customized,'graduation');
 for(const field of ['name','hostNames','message','eventDate','venue','imageUrl'])assert.equal(changed[field],customized[field]);
 assert.deepEqual(changed.sections.find(s=>s.type==='story'),customized.sections.find(s=>s.type==='story'));
 assert.equal(changed.sections.find(s=>s.type==='rsvp').enabled,false);
});

test('opening saved events does not seed messages, enable missing sections or replace saved content',()=>{
 const {initialGuidedValues}=setup();
 const stored={id:'saved',eventType:'baby_shower',message:'',sections:[{id:'own',type:'story',title:'Mi título',content:'',detail:'',link:'',imageUrl:'',enabled:false}]};
 const values=initialGuidedValues(stored);
 assert.equal(values.message,'');
 assert.ok(values.sections.every(s=>!s.enabled));
 assert.ok(values.sections.every(s=>!s.content));
 assert.deepEqual(values.sections[0],stored.sections[0]);
});
test('shared invitations prepare, save, validate publication and retain custom sections for all occasions',async()=>{
 for(const eventType of ['wedding','birthday','graduation','baby_shower','anniversary','other']){
  const {f,eventPublicationIssues}=setup();
  const section={id:'own',type:'custom',title:'Mi nota',content:'Información propia',detail:'',link:'',imageUrl:'',imageUrls:[],enabled:true};
  const form=f.saveForm('',[section]);
  const key=randomUUID();
  for(const [field,value] of Object.entries({eventType,templateId:'celebration-v1',creationKey:key,texture:'paper',name:'Mi celebración',hostNames:'Alex',eventDate:'2027-10-12',eventTime:'17:00',venue:'Mi lugar',address:'Mi dirección'}))form.set(field,value);
  assert.equal((await f.load('app/crear/actions.ts').prepareEvent(form)).ok,true);
  assert.equal(f.state.events.get(key).templateId,'celebration-v1');
  assert.equal((await f.actions.updateEvent('event',form)).ok,true);
  const saved=f.state.events.get('event');
  assert.equal(saved.eventType,eventType);assert.equal(saved.templateId,'celebration-v1');assert.equal(saved.texture,'none');
  assert.equal(saved.hostNames,'Alex');assert.equal(saved.sections[0].content,'Información propia');
  assert.equal(eventPublicationIssues(saved).length,0);
  assert.equal(eventPublicationIssues({...saved,hostNames:'',eventDate:null,eventTime:'',venue:'',address:''}).length,5);
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
test('retired birthday selections prepare the shared presentation and incomplete birthdays cannot proceed to payment',async()=>{
 const {f,guidedSections}=setup();const form=f.saveForm();const key=randomUUID();
 form.set('eventType','birthday');form.set('templateId','birthday-confetti-v1');form.set('creationKey',key);
 assert.equal((await f.load('app/crear/actions.ts').prepareEvent(form)).ok,true);
 assert.equal(f.state.events.get(key).templateId,'celebration-v1');
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
 assert.equal(f.state.events.get(key).templateId,'celebration-v1');
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
 assert.equal(f.state.events.get(key).templateId,'celebration-v1');
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
 assert.equal((await f.load('app/crear/actions.ts').prepareEvent(form)).ok,true);assert.equal(f.state.events.get(key).templateId,'celebration-v1');
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
 assert.equal((await f.load('app/crear/actions.ts').prepareEvent(form)).ok,true);assert.equal(f.state.events.get(key).templateId,'celebration-v1');
 assert.equal((await f.actions.updateEvent('event',form)).ok,true);assert.equal(f.state.events.get('event').templateId,birthdayDinosaurId);
});

test('new occasions suggest their own font pairs and type changes preserve customized fonts',()=>{
 const {initialGuidedValues,changeGuidedEventType}=setup();
 const birthday=initialGuidedValues({id:'',eventType:'birthday',sections:[]});
 assert.equal(birthday.typography,'fredoka');assert.equal(birthday.bodyTypography,'nunito');
 const graduation=changeGuidedEventType(birthday,'graduation');assert.equal(graduation.typography,'cinzel');assert.equal(graduation.bodyTypography,'inter');
 const customized=changeGuidedEventType({...birthday,typography:'rye',bodyTypography:'lora'},'graduation');assert.equal(customized.typography,'rye');assert.equal(customized.bodyTypography,'lora');
});

test('the detail journey keeps excluded recommendations stable and offers extra details only when added',()=>{
 const {guidedSections,guidedContentSectionIds}=setup();
 const sections=guidedSections('birthday');const story=sections.find(s=>s.type==='story');const gallery=sections.find(s=>s.type==='gallery');
 const before=guidedContentSectionIds('birthday',sections);assert.equal(before[0],'__welcome');assert.equal(before.at(-1),'__more');assert.ok(!before.includes(gallery.id));
 story.enabled=false;assert.deepEqual(guidedContentSectionIds('birthday',sections),before);
 gallery.enabled=true;assert.ok(guidedContentSectionIds('birthday',sections).includes(gallery.id));
 gallery.enabled=false;assert.ok(guidedContentSectionIds('birthday',sections,gallery.id).includes(gallery.id));assert.ok(!guidedContentSectionIds('birthday',sections).includes(gallery.id));
 assert.ok(story.content);assert.equal(story.enabled,false);
});
