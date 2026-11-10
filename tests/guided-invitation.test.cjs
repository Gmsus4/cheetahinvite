/* eslint-disable @typescript-eslint/no-require-imports -- Exercise shared editor defaults and real server actions. */
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {randomUUID}=require('node:crypto');
const {createFixture}=require('./helpers/cloudinary-fixture.cjs');
function setup(){const f=createFixture();return {f,...f.load('lib/guided-invitation.ts')};}

test('creation information journey excludes visual blocks and retains added information and recovery', () => {
 const {guidedSections,guidedInformationSectionIds,guidedRecoveryStep,guidedRecoverySection}=setup();
 for(const type of ['wedding','birthday','graduation','baby_shower','anniversary','other']) {
  const sections=guidedSections(type);
  const ids=guidedInformationSectionIds(type,sections);
  assert.equal(ids.at(-1),'__more');
  assert.ok(ids.includes(sections.find(s=>s.type==='story').id));
  for(const visual of ['cover','countdown','location']) assert.ok(!ids.includes(sections.find(s=>s.type===visual).id));
  const gallery=sections.find(s=>s.type==='gallery');
  assert.ok(!ids.includes(gallery.id));gallery.enabled=true;
  assert.ok(guidedInformationSectionIds(type,sections).includes(gallery.id));
  const extra=sections.find(s=>s.type==='ceremony');extra.enabled=true;
  assert.ok(guidedInformationSectionIds(type,sections).includes(extra.id));
  assert.equal(guidedRecoverySection({step:4,activeExtra:`__add:${extra.id}`,flow:'content-v6'},sections),extra.id);
 }
 for(const step of [0,1,4,5,6])assert.equal(guidedRecoveryStep({step,activeExtra:null,flow:'content-v6'}),step);
});
test('previous draft flows migrate to the gradual journey without losing the active detail',()=>{
 const {guidedRecoveryStep,guidedRecoverySection,guidedRecoveryAppearance}=setup();
 for(const [step,expected] of [[0,0],[1,0],[2,4],[3,5],[15,5]])assert.equal(guidedRecoveryStep({step,activeExtra:null}),expected);
 for(const [step,expected] of [[0,0],[1,2],[2,4],[3,3],[4,5]])assert.equal(guidedRecoveryStep({step,activeExtra:null,flow:'content-v2'}),expected);
 for(const [step,activeExtra,expected] of [[0,null,0],[1,null,2],[1,'photos',2],[1,'content',4],[1,'appearance',3],[2,null,5]])assert.equal(guidedRecoveryStep({step,activeExtra,flow:'content-v3'}),expected);
 const sections=[{id:'my-story',enabled:true},{id:'disabled',enabled:false}];
 for(let step=0;step<6;step++)assert.equal(guidedRecoveryStep({step,activeExtra:null,flow:'content-v4'}),step===3?4:step===4?3:step);
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
  assert.ok(guidedPublicationIssues(values).some(issue=>issue.step===4 && issue.sectionId===rsvp.id));
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
  assert.ok(v.sections.filter(s=>s.enabled).every(s=>s.type==='countdown'||s.type==='cover'||s.type==='location'||s.content));
  assert.equal(v.sections.find(s=>s.type==='gallery').enabled,false);
  assert.equal(v.sections.find(s=>s.type==='ceremony').enabled,false);
  assert.ok(guidedDetails(eventType).some(s=>s.type==='rsvp'));
  assert.equal(v.templateId,'celebration-v1');assert.equal(v.texture,'none');
 }
});

test('optional primary location is not required when hidden or replaced by another venue',()=>{
 const {guidedPublicationIssues}=setup();
 const base={eventType:'wedding',hostNames:'Alex y Sam',eventDate:'2027-01-15',eventTime:'17:00',venue:'',address:'',sections:[]};
 const section={id:'main',type:'location',title:'La celebración',content:'',detail:'',link:'',imageUrl:'',enabled:false};
 assert.deepEqual(guidedPublicationIssues({...base,sections:[section]}),[]);
 const ceremony={...section,id:'ceremony',type:'ceremony',content:'La capilla',detail:'17:00',link:'Calle principal',enabled:true};
 assert.deepEqual(guidedPublicationIssues({...base,sections:[section,ceremony]}),[]);
 assert.equal(guidedPublicationIssues({...base,sections:[{...section,enabled:true},ceremony]}).length,2);
 assert.equal(guidedPublicationIssues({...base,sections:[{...section,enabled:true}]}).length,2);
});

test('block journey starts with cover and location before the remaining wedding details',()=>{
 const {guidedDetails,guidedSections,guidedContentSectionIds}=setup();
 assert.equal(guidedDetails('wedding').length,10);
 assert.ok(guidedDetails('wedding').every(section=>section.type!=='reception'));
 assert.equal(guidedDetails('wedding').find(section=>section.type==='ceremony').title,'Ceremonia');
 assert.ok(guidedDetails('wedding').every(section=>section.type!=='location'));
 const sections=guidedSections('wedding');
 const location=sections.find(section=>section.type==='location');
 assert.ok(location);
 assert.deepEqual(guidedContentSectionIds('wedding',sections).slice(0,3),[sections.find(section=>section.type==='cover').id,sections.find(section=>section.type==='countdown').id,location.id]);
 assert.ok(!guidedContentSectionIds('wedding',sections).includes('__welcome'));
 const {guidedRecoverySection}=setup();
 assert.equal(guidedRecoverySection({step:3,activeExtra:'__welcome',flow:'content-v4'},sections),sections.find(section=>section.type==='cover').id);
});

test('Maps URLs pasted in the old address field move to the exact link without printing as an address',()=>{
 const {initialGuidedValues,guidedPublicationIssues}=setup();
 const values=initialGuidedValues({id:'saved',eventType:'wedding',name:'Boda',hostNames:'Alex y Sam',eventDate:new Date('2027-01-15T12:00:00Z'),eventTime:'17:00',venue:'Mercado',address:'https://maps.app.goo.gl/ExactPin',sections:[]});
 assert.equal(values.address,'');
 assert.equal(values.sections.find(section=>section.type==='location').link,'https://maps.app.goo.gl/ExactPin');
 assert.deepEqual(guidedPublicationIssues(values),[]);
});

test('occasion presets enable relevant sections and use distinct celebration copy',()=>{
 const {guidedSections}=setup();
 const active=type=>guidedSections(type).filter(s=>s.enabled).map(s=>s.type);
 assert.deepEqual(active('wedding'),['cover','countdown','location','story','program','parents','gifts','rsvp']);
 assert.match(guidedSections('wedding').find(s=>s.type==='program').content,/Ceremonia/);
 assert.deepEqual(active('birthday'),['cover','countdown','location','story','program','parents','gifts','rsvp']);
 assert.deepEqual(active('baby_shower'),['cover','countdown','location','story','program','parents','gifts','rsvp']);
 assert.deepEqual(active('graduation'),['cover','countdown','location','story','program','parents','rsvp']);
 assert.deepEqual(active('anniversary'),['cover','countdown','location','story','program','parents','gifts','rsvp']);
 assert.deepEqual(active('other'),['cover','countdown','location','story','program','parents','rsvp']);
 assert.match(guidedSections('birthday').find(s=>s.type==='program').content,/Pastel/);
 assert.match(guidedSections('baby_shower').find(s=>s.type==='gifts').content,/bebé/);
});

test('legacy reception becomes the event location and its original data remains saved',()=>{
 const {initialGuidedValues,guidedDetails}=setup();
 const reception={id:'old-reception',type:'reception',title:'La fiesta',content:'Salón del Lago',detail:'19:00',link:'https://maps.app.goo.gl/ExactPin',imageUrl:'https://example.com/venue.webp',enabled:true,panelStyle:'glass'};
 const event={id:'saved',eventType:'wedding',venue:'',address:'',sections:[reception]};
 const values=initialGuidedValues(event);
 assert.equal(values.venue,'Salón del Lago');
 const location=values.sections.find(section=>section.type==='location');
 assert.equal(location.link,reception.link);
 assert.equal(location.imageUrl,reception.imageUrl);
 assert.equal(location.enabled,true);
 assert.deepEqual(values.sections.find(section=>section.type==='reception'),{...reception,enabled:false});
 const reopened=initialGuidedValues({...event,venue:values.venue,sections:values.sections.map(section=>section.type==='location'?{...section,enabled:false}:section)});
 assert.equal(reopened.sections.find(section=>section.type==='location').enabled,false);
 for(const type of ['wedding','birthday','graduation','baby_shower','anniversary','other']) assert.ok(guidedDetails(type).every(section=>section.type!=='reception'));
 const existing=initialGuidedValues({...event,venue:'Mi jardín',address:'Mi dirección',sections:[{...location,link:'https://maps.app.goo.gl/ChosenPin'},reception]});
 assert.equal(existing.venue,'Mi jardín');
 assert.equal(existing.address,'Mi dirección');
 assert.equal(existing.sections.find(section=>section.type==='location').link,'https://maps.app.goo.gl/ChosenPin');
});

test('changing occasion replaces untouched presets while preserving user data, edits and photos',()=>{
 const {initialGuidedValues,changeGuidedEventType}=setup();
 const initial=initialGuidedValues({id:'',eventType:'birthday',name:'',sections:[]});
 const switched=changeGuidedEventType(initial,'baby_shower');
 assert.equal(switched.name,'Nuestro baby shower');
 assert.match(switched.message,/dulce espera/);
 assert.deepEqual(switched.sections.filter(s=>s.enabled).map(s=>s.type),['cover','countdown','location','story','program','parents','gifts','rsvp']);
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
 assert.ok(values.sections.filter(s=>s.type!=='location'&&s.type!=='cover'&&s.type!=='countdown').every(s=>!s.enabled));
 assert.equal(values.sections.find(s=>s.type==='location').enabled,true);
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

test('existing birthday content, layout and enabled sections survive opening',()=>{
 const {initialGuidedValues}=setup();
 const old={id:'event',eventType:'birthday',templateId:'none',name:'Mi fiesta',hostNames:'Alex',accent:'#123456',typography:'inter',bodyTypography:'nunito',sections:[{id:'own',type:'custom',title:'Mi título',content:'Mi contenido',detail:'',link:'',imageUrl:'',enabled:true}]};
 const initial=initialGuidedValues(old);assert.equal(initial.accent,old.accent);assert.equal(initial.templateId,'none');assert.deepEqual(initial.sections[0],old.sections[0]);
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
 const before=guidedContentSectionIds('birthday',sections);assert.equal(before[0],sections.find(s=>s.type==='cover').id);assert.equal(before[1],sections.find(s=>s.type==='countdown').id);assert.equal(before[2],sections.find(s=>s.type==='location').id);assert.equal(before.at(-1),'__more');assert.ok(!before.includes(gallery.id));
 story.enabled=false;assert.deepEqual(guidedContentSectionIds('birthday',sections),before);
 gallery.enabled=true;assert.ok(guidedContentSectionIds('birthday',sections).includes(gallery.id));
 gallery.enabled=false;assert.ok(guidedContentSectionIds('birthday',sections,gallery.id).includes(gallery.id));assert.ok(!guidedContentSectionIds('birthday',sections).includes(gallery.id));
 assert.ok(story.content);assert.equal(story.enabled,false);
});


test('preview section picker lists disabled supported blocks only and is exhausted when all are included',()=>{
 const {f}=setup();const {guidedSections,availableGuidedSections}=f.load('lib/guided-invitation.ts');
 for(const eventType of ['wedding','birthday','graduation','baby_shower','anniversary','other']) {
  const sections=guidedSections(eventType).map(s=>({...s,enabled:false}));
  const before=structuredClone(sections);
  const available=availableGuidedSections(eventType,sections);
  assert.equal(available.length,sections.length-1);
  assert.ok(!available.some(s=>s.type==='cover'||s.type==='reception'));
  assert.deepEqual(sections,before);
  assert.equal(availableGuidedSections(eventType,sections.map(s=>({...s,enabled:true}))).length,0);
  const ceremony=sections.find(s=>s.type==='ceremony');
  assert.ok(!availableGuidedSections(eventType,[...sections,{...ceremony,id:'another',enabled:true}]).some(s=>s.type==='ceremony'));
 }
});

test('every occasion offers the same optional block catalog without enabling extra blocks by default',()=>{
 const {guidedSections,guidedContentSectionIds,availableGuidedSections}=setup();
 const catalog=['cover','countdown','location','story','ceremony','program','parents','dress_code','gifts','gallery','rsvp','music','custom'];
 for(const eventType of ['wedding','birthday','graduation','baby_shower','anniversary','other']) {
  const sections=guidedSections(eventType);
  assert.deepEqual(sections.map(section=>section.type),catalog);
  const available=availableGuidedSections(eventType,sections);
  for(const type of ['music','custom']) {
   const section=sections.find(section=>section.type===type);
   assert.equal(section.enabled,false);
   assert.ok(available.some(option=>option.id===section.id));
   assert.ok(!guidedContentSectionIds(eventType,sections).includes(section.id));
   section.enabled=true;
   assert.ok(guidedContentSectionIds(eventType,sections).includes(section.id));
   assert.ok(!availableGuidedSections(eventType,sections).some(option=>option.id===section.id));
  }
 }
});

test('existing weddings gain missing optional playlist and information blocks without altering saved content',()=>{
 const {guidedSections,initialGuidedValues,availableGuidedSections}=setup();
 const original=guidedSections('wedding').filter(section=>!['music','custom'].includes(section.type));
 original.find(section=>section.type==='story').content='Nuestra historia personalizada';
 original.find(section=>section.type==='gifts').enabled=false;
 const before=structuredClone(original);
 const values=initialGuidedValues({id:'saved',eventType:'wedding',sections:original});
 for(const section of before) assert.deepEqual(values.sections.find(item=>item.id===section.id),section);
 const optional=availableGuidedSections('wedding',values.sections);
 for(const type of ['music','custom']) {
  const section=optional.find(section=>section.type===type);
  assert.ok(section);
  assert.equal(section.enabled,false);
  assert.equal(section.content,'');
 }
 assert.deepEqual(original,before);
});


test('new style journey restores each substep and keeps block recovery separate',()=>{
 const {guidedRecoveryStep,guidedRecoverySection,guidedRecoveryAppearanceStep}=setup();
 const ids=['corners','icons','surface','colors','fonts'];
 for(const [index,id] of ids.entries()) {
  const wizard={step:3,activeExtra:'style:'+id,flow:'content-v5'};
  assert.equal(guidedRecoveryStep(wizard),3);assert.equal(guidedRecoveryAppearanceStep(wizard),index);
 }
 assert.equal(guidedRecoveryAppearanceStep({step:3,activeExtra:'style:unknown',flow:'content-v5'}),0);
 assert.equal(guidedRecoveryAppearanceStep({step:4,activeExtra:'appearance-custom',flow:'content-v4'}),3);
 const sections=[{id:'cover',type:'cover'},{id:'story',type:'story'}];
 const wizard={step:4,activeExtra:'__add:story',flow:'content-v5'};
 assert.equal(guidedRecoveryStep(wizard),4);assert.equal(guidedRecoverySection(wizard,sections),'story');
});
