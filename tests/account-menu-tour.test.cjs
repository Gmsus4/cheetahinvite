/* eslint-disable @typescript-eslint/no-require-imports -- Exercise optional help without navigation or sign-out. */
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const ts=require('typescript');
const {createFixture}=require('./helpers/cloudinary-fixture.cjs');
const {accountMenuTourSteps}=createFixture().load('lib/account-menu-tour.ts');

test('account help has five options and never includes an administration step',()=>{
 const regular=accountMenuTourSteps();
 assert.equal(regular.length,5);
 assert.equal(regular.some(step=>step.element.includes('admin')),false);
 assert.match(regular.at(-1).popover.description,/guardadas seguirán/);
 assert.ok(regular.every(step=>!step.onHighlighted&&!step.onDeselected));
});

test('help starts only on request, keeps the menu open while focused outside it, and restores normal closing',async()=>{
 const slots=[],refs=[],cleanups=[];let stateIndex=0,refIndex=0,config,focused=0;
 const effects=[];
 const react={
  useState(value){const i=stateIndex++;if(!(i in slots))slots[i]=value;return[slots[i],next=>{slots[i]=typeof next==='function'?next(slots[i]):next;}];},
  useRef(value){const i=refIndex++;return refs[i]??={current:value};},
  useId:()=> 'menu',useEffect:fn=>effects.push(fn),
 };
 const source=ts.transpileModule(fs.readFileSync('components/dashboard/DashboardAccountMenu.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
 const mod={exports:{}};
 new Function('require','module','exports','window','document',source)(name=>{
  if(name==='react')return react;if(name==='react/jsx-runtime')return require(name);
  if(name==='next-auth/react')return{getSession:async()=>({user:{role:'USER'}})};
  if(name==='@/lib/account-menu-tour')return{accountMenuTourSteps};
  if(name==='driver.js')return{driver:options=>{config=options;return{drive(){},destroy(){options.onDestroyed();}};}};
  if(name.endsWith('.css'))return{};
  return new Proxy({},{get:()=>()=>null});
 },mod,mod.exports,{matchMedia:()=>({matches:true})},{addEventListener(){},removeEventListener(){}});
 function nodes(node){return Array.isArray(node)?node.flatMap(nodes):node?.props?[node,...nodes(node.props.children)]:[];}
 function render(){stateIndex=0;refIndex=0;effects.length=0;const root=mod.exports.DashboardAccountMenu({name:'Prueba',email:'test@example.invalid'});const all=nodes(root);for(const node of all)if(node.props.ref)node.props.ref.current={style:{},querySelector:selector=>({selector,focus(){}}),setAttribute(){},removeAttribute(){},focus:()=>focused++};return{root,all};}
 const flush=async()=>{for(let i=0;i<20;i++)await Promise.resolve();};
 let ui=render();assert.equal(config,undefined);
 ui.all.find(n=>n.props['aria-label']==='Menú de mi cuenta').props.onClick();ui=render();
 const start=ui.all.find(n=>n.props.className==='dashboard-account-guide');assert.ok(start);
 start.props.onClick();await flush();ui=render();
 assert.equal(config.steps.length,5);assert.equal(config.disableActiveInteraction,true);
 ui.root.props.onBlur({currentTarget:{contains:()=>false}});assert.equal(slots[0],true);
 config.onDestroyed();assert.ok(focused>0);
 ui=render();ui.root.props.onBlur({currentTarget:{contains:()=>false}});assert.equal(slots[0],false);
 cleanups.forEach(fn=>fn?.());
});
