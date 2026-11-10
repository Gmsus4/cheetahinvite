/* eslint-disable @typescript-eslint/no-require-imports -- Validate creation and publication requirements without a database. */
const {test}=require('node:test');const assert=require('node:assert/strict');
const {createFixture}=require('./helpers/cloudinary-fixture.cjs');
function setup(){const f=createFixture();const {initialGuidedValues}=f.load('lib/guided-invitation.ts');return{...f.load('lib/invitation-required-fields.ts'),values:initialGuidedValues({id:'',eventType:'birthday',sections:[]})};}
test('creation requires names, date, time and venue with either an address or a location link',()=>{
 const {values,creationRequiredFields:validate}=setup();
 assert.deepEqual(validate({...values,name:' '}).map(e=>e.field),['w-hosts','w-name','w-date','w-time','w-venue','w-address']);
 const complete={...values,hostNames:'Sofía',eventDate:'2027-01-15',eventTime:'17:00',venue:'Salón'};
 assert.deepEqual(validate({...complete,address:'Calle de prueba'}),[]);
 const sections=complete.sections.map(s=>s.type==='location'?{...s,link:'https://maps.app.goo.gl/location'}:s);
 assert.deepEqual(validate({...complete,sections}),[]);
 assert.ok(validate({...complete,sections:sections.map(s=>s.type==='location'?{...s,link:'ubicación'}:s)}).some(e=>e.field==='w-map'));
});
test('optional blocks validate only when enabled, and gallery photos are deferred until publication',()=>{
 const {values,requiredSectionFields:validate}=setup();
 const section=type=>values.sections.find(s=>s.type===type);
 assert.deepEqual(validate({...section('story'),enabled:false,content:''}),[]);
 assert.ok(validate({...section('story'),content:' '}).some(e=>e.field.endsWith('-content')));
 const gallery={...section('gallery'),enabled:true};
 assert.deepEqual(validate(gallery),[]);assert.equal(validate(gallery,true).length,1);
 assert.deepEqual(validate({...gallery,imageUrls:['https://example.com/photo.jpg']},true),[]);
 assert.ok(validate({...gallery,title:' '}).some(e=>e.field.endsWith('-title')));
});
test('program requires named activities and playlist requires a valid web link',()=>{
 const {values,requiredSectionFields:validate}=setup();
 const program=values.sections.find(s=>s.type==='program');
 assert.ok(validate({...program,content:'17:00 — '} ).length);
 assert.deepEqual(validate({...program,content:'Llegada de invitados'}),[]);
 const music={...values.sections.find(s=>s.type==='music'),enabled:true,content:'Mi playlist'};
 assert.ok(validate(music).some(e=>e.field.endsWith('-link')));
 assert.ok(validate({...music,link:'javascript:alert(1)'}).length);
 assert.deepEqual(validate({...music,link:'https://example.com/playlist'}),[]);
});
test('ceremony requires its place, schedule and address while gifts and extra info accept a message or link',()=>{
 const {values,requiredSectionFields:validate}=setup();
 const ceremony={...values.sections.find(s=>s.type==='ceremony'),enabled:true};
 assert.equal(validate(ceremony).length,3);
 assert.deepEqual(validate({...ceremony,content:'Capilla',detail:'17:00',link:'Calle principal'}),[]);
 for(const type of ['gifts','custom']){const section={...values.sections.find(s=>s.type===type),enabled:true,content:'',link:''};assert.equal(validate(section).length,1);assert.deepEqual(validate({...section,content:'Mis palabras'}),[]);assert.deepEqual(validate({...section,link:'https://example.com/info'}),[]);}
});
test('integrated confirmations allow zero companions and external confirmations require a destination',()=>{
 const {values,requiredSectionFields:validate}=setup();const rsvp=values.sections.find(s=>s.type==='rsvp');
 assert.deepEqual(validate({...rsvp,maxCompanions:0}),[]);
 assert.ok(validate({...rsvp,rsvpMode:'external',link:''}).length);
 assert.ok(validate({...rsvp,rsvpMode:'external',whatsappPhone:'+52 5',link:'https://wa.me/525'}).length);
 assert.deepEqual(validate({...rsvp,rsvpMode:'external',link:'https://wa.me/525512345678'}),[]);
});
