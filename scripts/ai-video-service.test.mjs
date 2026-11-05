import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { serveAiVideo, providerCostUsd } from "../lib/ai-video-service.mjs";
import { weddingVideoPrompt } from "../lib/ai-wedding-prompt.mjs";
const code = "test-owner-access-code-12345";
const bytes = Buffer.from([137,80,78,71,13,10,26,10,1,2,3]);
const image = `data:image/png;base64,${bytes.toString("base64")}`;
const photoHash = createHash("sha256").update(bytes).digest("hex");
const options = { model: "grok-imagine-video-1.5-lite", resolution: "720p", seconds: 15, style: "Marathi wedding", ceremony: "wedding", photoHash };
test("editable full prompt is used exactly as confirmed, including long Unicode prompts",async()=>{
  let sent;const {call}=setup(async(url,init)=>{sent=JSON.parse(init.body).prompt;return Response.json({request_id:"custom-prompt"});});
  const prompt="मंदिर और फूलों का आंगन। ".repeat(160);
  const q=await(await call("quote",{...options,promptMode:"replace",customPrompt:prompt})).json();assert.ok(q.token);
  assert.equal((await call("generate",{token:q.token,confirmed:true,image,customPrompt:"unconfirmed changes"})).status,202);assert.equal(sent,prompt);
  assert.equal((await call("quote",{...options,promptMode:"replace",customPrompt:"  "})).status,400);
  assert.equal((await call("quote",{...options,promptMode:"replace",customPrompt:"a".repeat(24001)})).status,400);
});
test("trusted loopback server can omit access code, production cannot",async()=>{
  const {deps}=setup();deps.allowLocalAccess=true;deps.accessCode="";
  const config=await(await serveAiVideo(new Request("http://localhost:3000/api/ai-video/config"),deps)).json();assert.equal(config.ready,true);assert.equal(config.accessRequired,false);
  const local=await serveAiVideo(new Request("http://localhost:3000/api/ai-video/quote",{method:"POST",headers:{origin:"http://localhost:3000"},body:JSON.stringify(options)}),deps);assert.equal(local.status,200);
  const remote=await(await serveAiVideo(new Request("https://test.example/api/ai-video/config"),deps)).json();assert.equal(remote.ready,false);assert.equal(remote.accessRequired,true);
  const foreign=await serveAiVideo(new Request("http://localhost:3000/api/ai-video/quote",{method:"POST",headers:{origin:"https://other.example"},body:JSON.stringify(options)}),deps);assert.equal(foreign.status,403);
});
function setup(fetcher) {
  const data = new Map();
  const deps = { apiKey: "fake-key-for-tests", accessCode: code, now: 1000000, fetcher: fetcher || (() => { throw new Error("Unexpected provider request"); }), store: {
    get: async (k) => data.get(k), set: async (k,v) => data.set(k,v), claim: async (k,v) => { if (data.has(k)) return false; data.set(k,v); return true; },
  } };
  const call = (action, body, overrides = {}) => serveAiVideo(new Request(`https://test.example/api/ai-video/${action}`, { method: "POST", headers: { "content-type": "application/json", "x-ai-access-code": code, origin: "https://test.example", ...overrides }, body: JSON.stringify(body) }), deps);
  return { deps, call };
}
test("configuration and quote make no provider calls", async () => {
  const { deps, call } = setup();
  const config = await serveAiVideo(new Request("https://test.example/api/ai-video/config"), deps);
  assert.equal((await config.json()).ready, true);
  const q = await (await call("quote", options)).json();
  assert.equal(q.totalCents,46); assert.ok(q.token); assert.equal(JSON.stringify(q).includes("fake-key"), false);
});
test("unconfirmed, tampered and changed-photo requests never start paid work", async () => {
  const { call } = setup(); const q = await (await call("quote", options)).json();
  assert.equal((await call("generate", { token:q.token, image })).status,400);
  assert.equal((await call("generate", { token:q.token+'x', confirmed:true, image })).status,400);
  assert.equal((await call("generate", { token:q.token, confirmed:true, image:image.slice(0,-4)+'BAUG' })).status,409);
});
test("one explicit confirmation starts exactly one paid POST, including concurrent clicks", async () => {
  let starts=0; const { call }=setup(async (url, init) => { starts++; const body=JSON.parse(init.body); assert.equal(body.image.url,image); assert.equal(body.duration,15); return Response.json({request_id:"provider-job-1"}); });
  const q=await (await call("quote",options)).json();
  await Promise.all([call("generate",{token:q.token,confirmed:true,image}),call("generate",{token:q.token,confirmed:true,image})]);
  await call("generate",{token:q.token,confirmed:true,image}); assert.equal(starts,1);
});
test("status polling returns video without another generation charge", async () => {
  let starts=0; const {call}=setup(async (url,init)=> { if(init.method==='POST'){ starts++;return Response.json({request_id:"job-2"}); } return Response.json({status:"done",video:{url:"https://vidgen.x.ai/generated/sample.mp4"}}); });
  const q=await (await call("quote",options)).json(); await call("generate",{token:q.token,confirmed:true,image});
  const result=await (await call("status",{token:q.token})).json(); assert.equal(result.state,"done"); assert.ok(result.videoUrl); assert.equal(result.requestId,undefined); assert.equal(starts,1);
});
test("expired quotes require fresh review",async()=>{const {call,deps}=setup();const q=await (await call("quote",options)).json();deps.now+=600001;assert.equal((await call("generate",{token:q.token,confirmed:true,image})).status,409);});
test("connection loss never automatically retries a billable request",async()=>{let starts=0;const {call}=setup(async()=>{starts++;throw new Error("timeout");});const q=await (await call("quote",options)).json();const result=await (await call("generate",{token:q.token,confirmed:true,image})).json();assert.equal(result.state,"unknown");await call("generate",{token:q.token,confirmed:true,image});assert.equal(starts,1);});
test("missing configuration and incorrect access code fail closed",async()=>{const {call,deps}=setup();assert.equal((await call("quote",options,{"x-ai-access-code":"wrong"})).status,403);deps.apiKey="";assert.equal((await call("quote",options)).status,503);});
test("cross-origin requests are rejected",async()=>{const {call}=setup();assert.equal((await call("quote",options,{origin:"https://other.example"})).status,403);});
test("actual provider cost is converted from ticks, never substituted by an estimate",()=>{assert.equal(providerCostUsd({usage:{cost_in_usd_ticks:4600000000}}),0.46);assert.equal(providerCostUsd({usage:{cost_in_usd_ticks:"0"}}),0);assert.equal(providerCostUsd({}),null);assert.equal(providerCostUsd({usage:{cost_in_usd_ticks:-1}}),null);});
test("completed jobs expose the actual billed cost returned by xAI",async()=>{const {call}=setup(async(url,init)=>init.method==='POST'?Response.json({request_id:"job-cost"}):Response.json({status:"done",video:{url:"https://vidgen.x.ai/generated/test.mp4"},usage:{cost_in_usd_ticks:3700000000}}));const q=await(await call("quote",options)).json();await call("generate",{token:q.token,confirmed:true,image});const result=await(await call("status",{token:q.token})).json();assert.equal(result.actualCostUsd,0.37);assert.equal(result.estimatedCents,46);});
test("a completed job can refresh delayed billing without another paid POST",async()=>{let starts=0,polls=0;const {call}=setup(async(url,init)=>{if(init.method==='POST'){starts++;return Response.json({request_id:"delayed-cost"});}polls++;return Response.json({status:"done",video:{url:"https://vidgen.x.ai/generated/test.mp4"},...(polls>1?{usage:{cost_in_usd_ticks:4600000000}}:{})});});const q=await(await call("quote",options)).json();await call("generate",{token:q.token,confirmed:true,image});assert.equal((await(await call("status",{token:q.token})).json()).actualCostUsd,undefined);assert.equal((await(await call("status",{token:q.token})).json()).actualCostUsd,.46);assert.equal(starts,1);});
test("film parts and creative direction are bound to the confirmed quote",async()=>{let prompt;const {call}=setup(async(url,init)=>{prompt=JSON.parse(init.body).prompt;return Response.json({request_id:"film-part"});});const q=await(await call("quote",{...options,ceremony:"journey-opening",customPrompt:"Slow crane shot"})).json();await call("generate",{token:q.token,confirmed:true,image,customPrompt:"Different prompt"});assert.match(prompt,/Ganpati mandir/);assert.match(prompt,/Mehendi/);assert.match(prompt,/Haldi/);assert.match(prompt,/Slow crane shot/);assert.doesNotMatch(prompt,/Different prompt/);assert.match(weddingVideoPrompt("Marathi wedding","journey-finale"),/antarpat/);assert.equal((await call("quote",{...options,seconds:30})).status,400);});
test("authenticated media loading streams the existing clip without generating again",async()=>{let starts=0;const {call}=setup(async(url,init)=>{if(init.method==='POST'){starts++;return Response.json({request_id:"media-job"});}if(url.includes('/v1/videos/'))return Response.json({status:"done",video:{url:"https://vidgen.x.ai/generated/test.mp4"},usage:{cost_in_usd_ticks:4600000000}});return new Response(new Uint8Array([1,2,3]));});const q=await(await call("quote",options)).json();await call("generate",{token:q.token,confirmed:true,image});await call("status",{token:q.token});assert.equal((await call("media",{token:q.token},{"x-ai-access-code":"wrong"})).status,403);const media=await call("media",{token:q.token});assert.equal(media.headers.get("content-type"),"video/mp4");assert.deepEqual([...new Uint8Array(await media.arrayBuffer())],[1,2,3]);assert.equal(starts,1);});


test("culture prompts do not carry Marathi wedding scenes into other traditions", async()=>{
  const {call}=setup(()=>{throw new Error("Quote must not call provider");});
  for(const style of ["Bengali wedding","Marwari wedding","Gujarati wedding","Sikh wedding","Muslim wedding","Christian wedding"]){
    const prompt=weddingVideoPrompt(style,"journey-finale");
    assert.doesNotMatch(prompt,/Nauvari|Paithani|mundavalya|Lavani|dhol-tasha/);
    assert.match(prompt,new RegExp(style));
    assert.equal((await call("quote",{...options,style})).status,200);
  }
  assert.match(weddingVideoPrompt("Gujarati wedding","wedding"),/panetar/);
  assert.match(weddingVideoPrompt("Sikh wedding","wedding"),/Anand Karaj/);
  assert.match(weddingVideoPrompt("Muslim wedding","wedding"),/nikah/);
  assert.match(weddingVideoPrompt("Christian wedding","wedding"),/exchange of rings/);
});


test("complete story quote submits all scenes in one paid request",async()=>{
  const {storyFilmPrompt}=await import('../lib/ai-story.mjs');
  const scenes=[{title:'Hello',description:'Meet at a bookshop'},{title:'Coffee',description:'Laugh in a cafe'},{title:'Proposal',description:'Ring by a lake'}];
  let starts=0,submitted;
  const {call}=setup(async(url,init)=>{starts++;submitted=JSON.parse(init.body);return Response.json({request_id:'complete-story'});});
  const q=await(await call('quote',{...options,ceremony:'story',seconds:15,promptMode:'replace',customPrompt:storyFilmPrompt(scenes,{seconds:15}),storyScene:{title:'Our story',index:0,count:3,scenes}})).json();
  assert.equal(q.totalCents,46);
  await call('generate',{token:q.token,confirmed:true,image});
  assert.equal(starts,1);assert.equal(submitted.duration,15);
  for(const scene of scenes)assert.ok(submitted.prompt.includes(scene.description));
});


test("long multilingual story descriptions and full prompts pass the signed generation flow",async()=>{
 const {FULL_PROMPT_LIMIT,SCENE_DESCRIPTION_LIMIT}=await import('../lib/ai-video-limits.mjs');
 let starts=0,submitted;
 const {call}=setup(async(url,init)=>{starts++;submitted=JSON.parse(init.body);return Response.json({request_id:'long-story'});});
 const customPrompt='म'.repeat(FULL_PROMPT_LIMIT);
 const storyScene={title:'Our story',index:0,count:6,scenes:Array.from({length:6},(_,i)=>({title:'Scene '+i,description:'क'.repeat(SCENE_DESCRIPTION_LIMIT)}))};
 const quoted=await call('quote',{...options,ceremony:'story',storyScene,promptMode:'replace',customPrompt});assert.equal(quoted.status,200);
 const q=await quoted.json();assert.ok(q.token.length>40000);
 assert.equal((await call('generate',{token:q.token,confirmed:true,image})).status,202);assert.equal(starts,1);assert.equal(submitted.prompt,customPrompt);
 assert.equal((await call('quote',{...options,promptMode:'replace',customPrompt:customPrompt+'x'})).status,400);
});


test('story suggestions use text API only after explicit consent, without changing stored videos',async()=>{
 let calls=0,payload;
 const {call}=setup(async(url,init)=>{calls++;assert.equal(url,'https://api.x.ai/v1/responses');payload=JSON.parse(init.body);return Response.json({output:[{type:'message',content:[{type:'output_text',text:'They meet in a sunlit bookshop, exchange shy smiles and share a coffee.'}]}],usage:{cost_in_usd_ticks:1000000}});});
 const story='They meet in a bookshop and later have coffee together.';
 assert.equal((await call('suggest-story',{story})).status,400);assert.equal(calls,0);
 const response=await call('suggest-story',{story,confirmed:true,animation:'Watercolour storybook',seconds:15});assert.equal(response.status,200);
 const data=await response.json();assert.match(data.suggestion,/sunlit bookshop/);assert.equal(data.actualCostUsd,.0001);assert.equal(calls,1);assert.equal(payload.store,false);assert.equal(payload.model,'grok-4.3');assert.equal(payload.input[1].content,story);
 assert.equal((await call('suggest-story',{story,confirmed:true},{'x-ai-access-code':'wrong'})).status,403);assert.equal(calls,1);
});
test('suggestion failure never retries or replaces the users story',async()=>{let calls=0;const {call}=setup(()=>{calls++;throw new Error('network interrupted');});const response=await call('suggest-story',{story:'We met at a bookshop, fell in love and got engaged.',confirmed:true});assert.equal(response.status,503);assert.equal(calls,1);assert.equal((await response.json()).suggestion,undefined);});
test('freeform story is bound to one confirmed video prompt',async()=>{const {storyFilmPrompt,validStoryScene}=await import('../lib/ai-story.mjs');const story='We met at a bookshop. Later our families met at home.';const prompt=storyFilmPrompt(story,{seconds:15});assert.ok(prompt.includes(story));assert.ok(!prompt.includes('undefined'));const {call}=setup();const scene={title:'Our story',index:0,count:1,storyText:story};assert.equal(validStoryScene(scene),true);const response=await call('quote',{...options,ceremony:'story',storyScene:scene,promptMode:'replace',customPrompt:prompt});assert.equal(response.status,200);assert.equal((await response.json()).storyScene.storyText,story);});

test('scene improvements respect the scene description limit',async()=>{let instructions;const {call}=setup(async(url,init)=>{instructions=JSON.parse(init.body).input[0].content;return Response.json({output:[{type:'message',content:[{type:'output_text',text:'x'.repeat(3001)}]}]});});const response=await call('suggest-story',{story:'We met at a quiet bookshop and had coffee together.',confirmed:true,maxCharacters:3000});assert.match(instructions,/under 3000 characters/);assert.equal(response.status,503);assert.equal((await response.json()).suggestion,undefined);});

test('media distinguishes expired links from temporary provider errors',async()=>{for(const [status,body,expectedCode] of [[404,'missing','VIDEO_EXPIRED'],[403,'Request has expired','VIDEO_EXPIRED'],[503,'unavailable','VIDEO_TEMPORARY'],[403,'Access denied','VIDEO_TEMPORARY']]){const {call}=setup(async(url,init)=>{if(init.method==='POST')return Response.json({request_id:'check-media'});if(url.includes('/v1/videos/'))return Response.json({status:'done',video:{url:'https://vidgen.x.ai/generated/test.mp4'},usage:{cost_in_usd_ticks:1100000000}});return new Response(body,{status});});const q=await(await call('quote',options)).json();await call('generate',{token:q.token,confirmed:true,image});await call('status',{token:q.token});const r=await call('media',{token:q.token});assert.equal((await r.json()).code,expectedCode);assert.equal(r.status,expectedCode==='VIDEO_EXPIRED'?410:503);}});
