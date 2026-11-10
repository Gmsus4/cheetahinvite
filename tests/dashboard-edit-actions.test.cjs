/* eslint-disable @typescript-eslint/no-require-imports -- Validate dashboard actions with real lifecycle rules. */
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const ts=require('typescript');
const {createFixture}=require('./helpers/cloudinary-fixture.cjs');

test('editable cards have separate information and design links; locked invitations do not offer design editing',()=>{
 const f=createFixture(), mod={exports:{}};
 const source=ts.transpileModule(fs.readFileSync('components/dashboard/DashboardContent.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
 new Function('require','module','exports',source)(name=>{
  if(name==='react/jsx-runtime')return require(name);
  if(name.startsWith('@/lib/'))return f.load(name.slice(2)+'.ts');
  return new Proxy({}, {get:()=>()=>null});
 },mod,mod.exports);
 const base={id:'draft',ownerId:'owner',name:'Invitación de prueba',eventType:'birthday',imageUrl:null,eventDate:null,paidAt:null,expiresAt:null,status:'DRAFT',slug:null,customSlug:null,updatedAt:new Date('2026-11-10')};
 const events=[base,{...base,id:'published',status:'PUBLISHED',slug:'publicada',paidAt:new Date(),expiresAt:new Date('2099-01-01')},{...base,id:'locked',status:'REFUNDED',paidAt:new Date()}];
 const view=mod.exports.DashboardContent({ownerId:'owner',now:new Date('2026-11-10').getTime(),userName:'Prueba',userEmail:'test@example.invalid',events});
 const nodes=node=>Array.isArray(node)?node.flatMap(nodes):node?.props?[node,...nodes(node.props.children)]:[];
 const all=nodes(view);
 for(const id of ['draft','published']){
  assert.ok(all.some(n=>n.props.href===`/dashboard/eventos/${id}`&&n.props['aria-label']==='Editar información: Invitación de prueba'));
  assert.ok(all.some(n=>n.props.href===`/dashboard/eventos/${id}/show?from=dashboard`&&n.props.target==='_blank'&&n.props['aria-label']==='Editar diseño: Invitación de prueba'));
 }
 assert.equal(all.some(n=>n.props.href==='/dashboard/eventos/locked/show'),false);
 assert.ok(all.some(n=>n.props.href==='/dashboard/eventos/locked/pago'));
});
