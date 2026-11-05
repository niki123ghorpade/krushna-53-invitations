"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { FULL_PROMPT_LIMIT, CONTINUATION_SUMMARY_LIMIT } from "@/lib/ai-video-limits.mjs";
import { applyGeneratedClip } from "@/lib/ai-clip-update.mjs";
import {cachedVideo,saveVideoCopy} from "@/lib/ai-video-cache.mjs";
import AiReelCost from "@/components/AiReelCost";
import AiStoryBuilder from "@/components/AiStoryBuilder";
import AiSavedVideos from "@/components/AiSavedVideos";
import { STORY_STYLES, storyFilmPrompt, newStoryEvent } from "@/lib/ai-story.mjs";
import { creditUnits, creditCents } from "@/lib/ai-credits.mjs";
import AiReelEditor from "@/components/AiReelEditor";
import { AI_CEREMONIES, AI_WEDDING_STYLES, weddingVideoPrompt } from "@/lib/ai-wedding-prompt.mjs";
import GenerationCostDialog from "@/components/GenerationCostDialog";
import { AI_VIDEO_MODELS, estimateAiVideo } from "@/lib/ai-video-pricing.mjs";

const fileData = (file) => new Promise((resolve, reject) => { const r = new FileReader(); r.onload = () => resolve(r.result); r.onerror = () => reject(new Error("Could not read this photo.")); r.readAsDataURL(file); });
async function digest(file) { return Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", await file.arrayBuffer())), (n) => n.toString(16).padStart(2, "0")).join(""); }
export default function AiVideoSetup({ renderEditor, editorProps = {}, mode, onModeChange }) {
  const [photo, setPhoto] = useState(null), [preview, setPreview] = useState("");
  const [sharedPhoto,setSharedPhoto]=useState(null),[reusePhoto,setReusePhoto]=useState(true);
  const [model, setModel] = useState(AI_VIDEO_MODELS[0].id), [resolution, setResolution] = useState("720p"), [seconds, setSeconds] = useState(15);
  const [style, setStyle] = useState("Marathi wedding"), [ceremony, setCeremony] = useState("journey-opening");
  const [storyMode,setStoryMode]=useState(false),[storyEvents,setStoryEvents]=useState([{id:"story-1",title:"",description:"",location:"",date:""}]),[storyAnimation,setStoryAnimation]=useState(STORY_STYLES[0]);
  const storyProject=useRef("");
  const [storyPart,setStoryPart]=useState(1),[previousStory,setPreviousStory]=useState("");
  const [history,setHistory]=useState([]),[historyBusy,setHistoryBusy]=useState(false),[historyError,setHistoryError]=useState("");

  const [promptDraft, setPromptDraft] = useState(null);
  const promptKey = storyMode ? JSON.stringify([storyEvents,storyAnimation,seconds,storyPart,previousStory]) : `${style}:${ceremony}:${seconds}`;
  const defaultPrompt = useMemo(() => storyMode ? storyFilmPrompt(storyEvents,{style:storyAnimation,seconds,part:storyPart,previousSummary:previousStory}) : weddingVideoPrompt(style, ceremony, seconds), [style, ceremony, seconds, storyMode, storyEvents, storyAnimation, storyPart, previousStory]);
  const promptText = promptDraft?.key === promptKey ? promptDraft.text : defaultPrompt;
  const [clips, setClips] = useState([]);
  const [accessCode, setAccessCode] = useState(""), [config, setConfig] = useState(null);
  const [error, setError] = useState(""), [quote, setQuote] = useState(null), [busy, setBusy] = useState(false);
  const [job, setJob] = useState(null), [token, setToken] = useState(""), [polling, setPolling] = useState(false);
  const [refreshingCharge, setRefreshingCharge] = useState(false), [chargeMessage, setChargeMessage] = useState("");
  const chargeLock = useRef(false);
  useEffect(() => { setChargeMessage(""); }, [token]);
  const [workspaceStarted,setWorkspaceStarted] = useState(false);
  const photoInput=useRef(null), editForm=useRef(null), replacement=useRef(null);
  const [editingClip,setEditingClip]=useState(null);
  const [selectingClip,setSelectingClip]=useState(false);
  const mediaCache=useRef(new Map()),selectLock=useRef(false);
  const [continuingVideo,setContinuingVideo]=useState(false);
  useEffect(()=>{if(mode){setContinuingVideo(false);setStoryMode(mode === "story");if(mode === "story"&&!storyProject.current){storyProject.current=crypto.randomUUID();setSeconds(15);}}},[mode]);
  useEffect(() => { if (workspaceStarted) try { sessionStorage.setItem("everymoment-ai-clips", JSON.stringify(clips.filter(c => c.videoUrl.startsWith("https://")))); } catch {} }, [clips,workspaceStarted]);
  useEffect(() => { if(job?.state === "done" && job.videoUrl){const clip={videoUrl:job.videoUrl,ceremony:job.ceremony,token,storyScene:job.storyScene,seconds:job.seconds,actualCostUsd:job.actualCostUsd};setClips(list=>applyGeneratedClip(list,clip,replacement.current?.token === token?replacement.current.videoUrl:null));} },[job,token]);
  useEffect(()=>{if(job?.state === "done"&&job.videoUrl&&token){void loadClip({videoUrl:job.videoUrl,token},AbortSignal.timeout(60000)).catch(()=>{});}},[job?.state,job?.videoUrl,token]); // eslint-disable-line react-hooks/exhaustive-deps
  const lock = useRef(false), version = useRef(0);
  const estimate = useMemo(() => estimateAiVideo({ model, resolution, seconds }), [model, resolution, seconds]);
  const accessReady = config?.ready && (config.accessRequired === false || Boolean(accessCode));
  const active = selectingClip || busy || job?.state === "pending" || job?.state === "starting";
  useEffect(() => { let alive = true; fetch("/api/ai-video/config").then((r) => r.json()).then((v) => alive && setConfig(v)).catch(() => alive && setConfig({ ready: false, message: "Could not reach the generation server. Restart local dev or check the deployed function." }));
    return () => { alive = false; version.current++; };
  }, []);
  useEffect(() => { if (!photo) { setPreview(""); return; } const url = URL.createObjectURL(photo); setPreview(url); return () => URL.revokeObjectURL(url); }, [photo]);
  useEffect(() => { setQuote(null); version.current++; }, [model, resolution, seconds, style, ceremony, promptText, promptKey, storyMode, accessCode]);
  async function api(action, body, signal) {
    const response = await fetch(`/api/ai-video/${action}`, { method: "POST", headers: { "content-type": "application/json", "x-ai-access-code": accessCode }, body: JSON.stringify(body), signal });
    const data = await response.json(); if (!response.ok) throw new Error(data.error || "Request failed. No automatic paid retry was made."); return data;
  }
  async function loadHistory(){if(!accessReady)return;setHistoryBusy(true);setHistoryError("");try{const data=await api("history",{});let edits={};try{edits=JSON.parse(localStorage.getItem("everymoment-video-edits")||"{}");}catch{}setHistory(data.clips.map(c=>({...c,editableDetails:edits[c.id]?{title:edits[c.id].title}:undefined})));}catch{setHistoryError("Could not load previous videos. Check the server and refresh videos.");}finally{setHistoryBusy(false);}}
  function editHistory(id,details){setHistory(list=>list.map(c=>c.id===id?{...c,editableDetails:details}:c));const entry=history.find(c=>c.id===id);setClips(list=>list.map(c=>c.videoUrl===entry?.videoUrl?{...c,editableDetails:details}:c));try{const edits=JSON.parse(localStorage.getItem("everymoment-video-edits")||"{}");edits[id]=details;localStorage.setItem("everymoment-video-edits",JSON.stringify(edits));}catch{}}
  function hideUnavailable(videoUrl){setHistory(list=>list.filter(c=>c.videoUrl !== videoUrl));mediaCache.current.delete(videoUrl);}
  async function useSavedClip(clip){
    if(active || selectLock.current)return;
    selectLock.current=true;setSelectingClip(true);
    try{await loadClip(clip,AbortSignal.timeout(20000));}catch(e){if(e.code === "VIDEO_EXPIRED")hideUnavailable(clip.videoUrl);else setHistoryError("Could not open this video right now. Check the connection, then try again.");return;}finally{selectLock.current=false;setSelectingClip(false);}

    setContinuingVideo(false);setEditingClip(clip); resetJob(); setPhoto(reusePhoto?sharedPhoto:null); if(photoInput.current)photoInput.current.value="";
    const nextStory=clip.ceremony === "story", nextStyle=clip.style || "Marathi wedding", duration=clip.seconds || 15;
    setStoryMode(nextStory); onModeChange?.(nextStory?"story":"wedding");
    setModel(clip.model || AI_VIDEO_MODELS[0].id);setResolution(["480p","720p"].includes(clip.resolution)?clip.resolution:"720p");setSeconds(duration);setStyle(nextStyle);
    if(nextStory){const savedEvents=clip.storyScene?.scenes || [{...newStoryEvent(),title:clip.storyScene?.title || "Our story",description:clip.storyScene?.storyText || clip.storyScene?.description || "",location:clip.storyScene?.location || "",date:clip.storyScene?.date || ""}];setStoryAnimation(clip.storyScene?.animation || STORY_STYLES[0]);setStoryEvents(savedEvents);setStoryPart(clip.storyScene?.part || 1);setPreviousStory(clip.storyScene?.previousSummary || "");storyProject.current=clip.storyScene?.projectId || crypto.randomUUID();setPromptDraft(null);}
    else{setCeremony(clip.ceremony || "wedding");setPromptDraft(clip.customPrompt?{key:nextStyle+":"+(clip.ceremony || "wedding")+":"+duration,text:clip.customPrompt}:null);}
    setQuote(null);setTimeout(()=>editForm.current?.scrollIntoView({behavior:"smooth",block:"start"}),0);
    setWorkspaceStarted(true);setClips([clip]);}
  useEffect(()=>{if(accessReady){void loadHistory();}},[accessReady,job?.state,job?.videoUrl]); // eslint-disable-line react-hooks/exhaustive-deps
  function startStory(){setStoryMode(true);if(!storyProject.current)storyProject.current=crypto.randomUUID();setSeconds(15);setPromptDraft(null);setQuote(null);setError("");}
  async function loadClip(clip, signal) {
    if(mediaCache.current.has(clip.videoUrl))return mediaCache.current.get(clip.videoUrl);
    const stored=await cachedVideo(clip.videoUrl);if(stored)return stored;
    if (clip.videoUrl.startsWith("blob:")) return (await fetch(clip.videoUrl)).blob();
    if (!clip.token || !accessReady) throw new Error("Enter your generation access code to load this clip, or upload the saved MP4.");
    const response = await fetch("/api/ai-video/media", { method: "POST", headers: { "content-type": "application/json", "x-ai-access-code": accessCode }, body: JSON.stringify({ token: clip.token }), signal });
    if (!response.ok) { const data = await response.json(); const error=new Error(data.error || "Could not load the video right now.");error.code=data.code;throw error; }
    const blob=await response.blob();
    void saveVideoCopy(clip.videoUrl,blob);
    mediaCache.current.set(clip.videoUrl,blob);
    while(mediaCache.current.size>3)mediaCache.current.delete(mediaCache.current.keys().next().value);
    return blob;
  }
  function saveJob(next, nextToken = token) { setJob(next); try { sessionStorage.setItem("everymoment-ai-job", JSON.stringify({ job: next, token: nextToken })); } catch { /* keep tab state */ } }
  const attemptedCharges = useRef(new Set());
  const [refreshingReelCost, setRefreshingReelCost] = useState(false);
  async function refreshReelCost() {
    if (!accessReady || refreshingReelCost) return;
    setRefreshingReelCost(true); setChargeMessage("");
    try {
      const tokens = [...new Set(clips.filter(c => c.token && !Number.isFinite(c.actualCostUsd)).map(c => c.token))];
      const results = await Promise.allSettled(tokens.map(async clipToken => ({clipToken, next:await api("status",{token:clipToken},AbortSignal.timeout(20000))})));
      const updated = results.filter(r => r.status === "fulfilled").map(r => r.value);
      setClips(list => list.map(c => { const result=updated.find(r=>r.clipToken===c.token); return result ? {...c,seconds:result.next.seconds ?? c.seconds,actualCostUsd:result.next.actualCostUsd ?? c.actualCostUsd} : c; }));
      const current=updated.find(r=>r.clipToken===token); if(current)saveJob({...job,...current.next});
      if(results.some(r=>r.status === "rejected"))setChargeMessage("Some clip usage records could not be refreshed. Confirmed credits used are retained; retry when the server is reachable.");
    } finally {setRefreshingReelCost(false);}
  }
  const pendingCostTokens = clips.filter(c=>c.token && !Number.isFinite(c.actualCostUsd)).map(c=>c.token).join("|");
  useEffect(() => { if(!accessReady || !pendingCostTokens) return; const key=accessCode+pendingCostTokens;if(attemptedCharges.current.has(key))return;attemptedCharges.current.add(key);void refreshReelCost(); },[accessCode,pendingCostTokens,accessReady]); // eslint-disable-line react-hooks/exhaustive-deps
  async function refreshCharge() {
    if (chargeLock.current || !token) return;
    setError(""); setChargeMessage("");
    if (Number.isFinite(job?.actualCostUsd)) { setChargeMessage("The actual credits used reported by xAI are already shown below."); return; }
    if (!accessReady) { setChargeMessage("Enter your generation access code above, then refresh the credits used."); return; }
    chargeLock.current = true; setRefreshingCharge(true);
    try {
      const next = await api("status", { token }, AbortSignal.timeout(20000));
      saveJob({ ...job, ...next });
      setChargeMessage(Number.isFinite(next.actualCostUsd) ? "Credits used updated from xAI. No new generation was started." : "xAI has not returned the actual credits used yet. Your video is ready; check xAI Console Usage or refresh later.");
    } catch (e) {
      const reason = e instanceof TypeError || e.name === "TimeoutError" ? "Could not reach the server to refresh billing. Check that the local server is running and your connection is available." : e.message;
      setChargeMessage(`${reason} Your completed video is unchanged. Refresh credits used again later; this does not start another paid generation.`);
    } finally { chargeLock.current = false; setRefreshingCharge(false); }
  }
  useEffect(() => {
    if (!polling || !token || !accessReady) return;
    let cancelled = false, timer; const controller = new AbortController();
    async function check() {
      try { const next = await api("status", { token }, controller.signal); if (cancelled) return; saveJob(next);
        if (next.state === "pending") timer = setTimeout(check, 5000);
        else { setPolling(false); if (next.error) setError(next.error); }
      } catch (e) { if (!cancelled) { setPolling(false); setError(e.message + " Use Check progress to resume this job."); } }
    }
    check(); return () => { cancelled = true; clearTimeout(timer); controller.abort(); };
  }, [polling, token, accessCode, accessReady]); // eslint-disable-line react-hooks/exhaustive-deps
  async function review(file = photo) {
    if (!file || active) return;
    if(storyMode && storyEvents.some(scene=>!scene.title.trim() || !scene.description.trim())){setError("Add a title and description for each scene before reviewing credits.");return;}
    const current = ++version.current; setError(""); setBusy(true);
    try {
      const base = { ...estimate, style, ceremony:storyMode?"story":ceremony };
      if (!accessReady) { setQuote(base); return; }
      const next = await api("quote", { model, resolution, seconds, style, ceremony:storyMode?"story":ceremony, storyScene:storyMode?{id:storyProject.current,projectId:storyProject.current,title:"Our story",part:storyPart,previousSummary:previousStory,animation:storyAnimation,index:0,count:storyEvents.length,scenes:storyEvents}:undefined, customPrompt: promptText, promptMode: "replace", photoHash: await digest(file) });
      if (current === version.current) setQuote(next);
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  }
  function removePhoto(){if(active)return;version.current++;setSharedPhoto(null);setReusePhoto(false);setPhoto(null);setQuote(null);setError("");setPromptDraft(null);if(photoInput.current)photoInput.current.value="";}
  function changePhoto(event) {
    const file = event.target.files?.[0]; if (!file) return;
    version.current++; setQuote(null); setError("");
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 3000000) { setError("Choose a JPG, PNG or WebP photo under 3 MB."); event.target.value = ""; setPhoto(null); return; }
    setWorkspaceStarted(true);setPhoto(file);setSharedPhoto(file);setReusePhoto(true);
  }
  async function generate(confirmedQuote) {
    if (lock.current || !confirmedQuote.token || !photo) return;
    replacement.current=editingClip?{token:confirmedQuote.token,videoUrl:clips.find(c=>c.videoUrl === editingClip.videoUrl)?.videoUrl || clips.filter(c=>c.ceremony === (storyMode?"story":ceremony)).at(-1)?.videoUrl || editingClip.videoUrl}:null;
    lock.current = true; setBusy(true); setError(""); setToken(confirmedQuote.token);
    saveJob({ state: "starting", estimatedCents: confirmedQuote.totalCents }, confirmedQuote.token);
    try { const next = await api("generate", { token: confirmedQuote.token, confirmed: true, image: await fileData(photo) }); saveJob(next, confirmedQuote.token); setQuote(null); if (next.state === "pending") setPolling(true); if (next.error) setError(next.error); }
    catch (e) { setQuote(null); setError(e.message + " Check this job’s progress before attempting another generation."); }
    finally { lock.current = false; setBusy(false); }
  }
  function continueVideo(){
    if(active)return;
    setContinuingVideo(true);setEditingClip(null);replacement.current=null;resetJob();setQuote(null);setPromptDraft(null);setSeconds(15);
    const previous=clips.filter(c=>c.ceremony !== "story").at(-1);
    setCeremony(previous?.ceremony === "journey-opening"?"journey-finale":"reception");
    setTimeout(()=>editForm.current?.scrollIntoView({behavior:"smooth",block:"start"}),0);
  }
  function continueStory(){
    if(active)return;
    const previous=clips.filter(c=>c.ceremony === "story").at(-1);
    const summary=previous?.storyScene?.storyText || previous?.storyScene?.scenes?.map(e=>e.title+": "+e.description).join("; ") || storyEvents.map(scene=>scene.title+": "+scene.description).join("; ");
    setPreviousStory(summary.slice(0,CONTINUATION_SUMMARY_LIMIT));
    setStoryPart((previous?.storyScene?.part || storyPart)+1);
    setStoryEvents([newStoryEvent()]);setSeconds(15);setPromptDraft(null);setQuote(null);setEditingClip(null);resetJob();
    setTimeout(()=>editForm.current?.scrollIntoView({behavior:"smooth",block:"start"}),0);
  }
  function resetJob() { setJob(null); setToken(""); setPolling(false); setError(""); try { sessionStorage.removeItem("everymoment-ai-job"); } catch {} }
  const visibleClips=clips.filter(c=>storyMode ? c.ceremony === "story" : c.ceremony !== "story");
  useEffect(()=>{if(mode && editingClip && ((mode === "story") !== (editingClip.ceremony === "story"))){setEditingClip(null);setPhoto(reusePhoto?sharedPhoto:null);setPromptDraft(null);}},[mode,editingClip]);
  return <section className="ai-video-setup">
    {!editingClip && !continuingVideo && (!storyMode || history.some(c=>c.ceremony === "story")) && <AiSavedVideos onUnavailable={hideUnavailable} loadClip={loadClip} story={storyMode} clips={history.filter(c=>storyMode ? c.ceremony === "story" : c.ceremony !== "story")} loading={historyBusy} error={historyError} onRefresh={loadHistory} onUse={useSavedClip} onEdit={editHistory} disabled={active}/>}
    {selectingClip && <p role="status" className="hint">Opening saved video…</p>}
    <p className="ai-connection-note">{config?.message || "Checking generation setup…"}</p>
    <p className="hint">{storyMode ? "Your complete story is generated as one video, up to 15 seconds total. Review one credit estimate for the complete story." : "Up to 15 seconds per request. For a 30-second film generate Opening and Finale separately, then preview and download the full reel."} Your photo is sent to xAI only after you confirm. Faces and motion may vary; image-to-video can begin with your uploaded image.</p>
    {!mode && <div className="ai-story-switch"><button type="button" disabled={active} onClick={storyMode?()=>setStoryMode(false):startStory}>{storyMode?"Back to wedding ceremonies":"Create your own story"}</button></div>}
    <form ref={editForm} onSubmit={(e) => { e.preventDefault(); void review(); }}>
      {config?.accessRequired !== false && <><label>Generation access code<input type="password" autoComplete="off" value={accessCode} onChange={(e) => setAccessCode(e.target.value)} disabled={busy} /></label>
      <p className="hint small">Provided by the site owner to authorise use of their API credits. This is not your xAI API key.</p></>}
      {!storyMode && continuingVideo && <p className="ai-connection-note">Continue this reel · next 15 seconds. The earlier clip stays in your reel. Choose the next ceremony or edit the prompt, upload a photo if needed, then review credits. Play full reel and Download reel include both parts.</p>}
      {editingClip && <section className="ai-editing-notice"><h3>Edit selected video</h3><p className="hint">Your video is in the phone preview. Edit its heading below, and names, dates and venue in the reel details. Text edits use no API credits.</p><label>Video heading<input maxLength={80} value={history.find(c=>c.id===editingClip.id)?.editableDetails?.title ?? editingClip.storyScene?.title ?? editingClip.ceremony} onChange={e=>editHistory(editingClip.id,{...history.find(c=>c.id===editingClip.id)?.editableDetails,title:e.target.value})}/></label><p className="hint">To change the couple photo or animation, choose a new photo and edit the prompt below. A new video is generated only after you confirm its credits. The finished result replaces the selected clip in this reel; it is not appended. The older version stays in your saved history.</p>{!editingClip.customPrompt && <p className="hint small">This older video has no saved prompt. A matching default is loaded for you to edit.</p>}<button type="button" disabled={active} onClick={()=>{setEditingClip(null);setPhoto(reusePhoto?sharedPhoto:null);setPromptDraft(null);setClips([]);if(photoInput.current)photoInput.current.value="";}}>Back to generated videos</button></section>}
      {sharedPhoto && <div className="ai-shared-photo"><label className="ai-auto-suggest"><input type="checkbox" checked={reusePhoto} disabled={active} onChange={e=>{setReusePhoto(e.target.checked);setPhoto(e.target.checked?sharedPhoto:null);setQuote(null);version.current++;if(photoInput.current)photoInput.current.value="";}}/>Use the same uploaded photo</label><p className="hint small">{sharedPhoto.name} · Available in Upload my own and Create your own story during this visit.</p>{reusePhoto&&<button type="button" disabled={active} onClick={()=>{setReusePhoto(false);setPhoto(null);setQuote(null);version.current++;if(photoInput.current)photoInput.current.value="";}}>Upload new photo</button>}</div>}
      {(!sharedPhoto || !reusePhoto) && <label>{editingClip ? "New couple photo for regeneration" : "Couple photo"}<input ref={photoInput} type="file" accept="image/jpeg,image/png,image/webp" onChange={changePhoto} disabled={active} /></label>}
      <p className="hint small">JPG, PNG or WebP · Under 3 MB · Uploading does not start paid generation.</p>
      {preview && <div className="ai-upload-wrap"><img className="ai-upload-preview" src={preview} alt="Uploaded couple photo preview" /><button type="button" className="ai-remove-photo" aria-label="Remove uploaded photo" disabled={active} onClick={removePhoto}>×</button></div>}
      {storyMode && storyPart>1 && <p className="ai-connection-note">Continuation · Part {storyPart}. Write the next part of your story. Earlier clips stay in the reel; this new 15-second part will be added after them. Each part needs its own credit confirmation.</p>}
      {storyMode&&<AiStoryBuilder events={storyEvents} onChange={setStoryEvents} onSuggest={body=>api("suggest-story",body)} suggestionsAvailable={!!accessReady} animation={storyAnimation} onAnimation={setStoryAnimation} seconds={seconds} disabled={active}/>}
      <fieldset disabled={active} className="ai-settings"><legend className="sr-only">Video settings</legend><div className="ai-video-fields">
        {!storyMode&&<><label>Wedding style<select value={style} onChange={(e) => setStyle(e.target.value)}>{AI_WEDDING_STYLES.map((s) => <option key={s}>{s}</option>)}</select></label>
        <label>Ceremony<select value={ceremony} onChange={(e) => setCeremony(e.target.value)}>{AI_CEREMONIES.filter(s=>s!=="story").map((s) => <option key={s} value={s}>{s === "journey-opening" ? "Film part 1 · Mandir, Mehendi, Haldi" : s === "journey-finale" ? "Film part 2 · Sangeet, Wedding, Reception" : s[0].toUpperCase() + s.slice(1)}</option>)}</select></label></>}
        <label>Video model<select value={model} onChange={(e) => setModel(e.target.value)}>{AI_VIDEO_MODELS.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}</select></label>
        <label>Resolution<select value={resolution} onChange={(e) => setResolution(e.target.value)}>{["480p", "720p"].map((s) => <option key={s}>{s}</option>)}</select></label>
        <label>{storyMode?"Total story duration":"Duration"}<select value={seconds} onChange={(e) => setSeconds(Number(e.target.value))}>{[5,10,15].map((s) => <option key={s} value={s}>{s} seconds</option>)}</select></label>
      </div>{(!storyMode && (photo || editingClip || continuingVideo)) && <div className="ai-editable-prompt"><label>Animation prompt · editable<textarea rows={9} maxLength={FULL_PROMPT_LIMIT} value={promptText} onChange={e => setPromptDraft({key:promptKey,text:e.target.value})} /></label><p className="hint small">{promptText.length.toLocaleString()} / {FULL_PROMPT_LIMIT.toLocaleString()} characters</p><button type="button" onClick={() => setPromptDraft(null)}>Reset to default prompt</button><p className="hint small">Edit the default prompt to change outfits, setting, animation or camera movement. Changing culture, ceremony or duration loads its matching default. Keep names, dates and venue in the reel form so they remain editable. Changes apply to the next generation.</p></div>}</fieldset>
      {(photo || editingClip || continuingVideo) && <><p className="ai-estimate">Estimated credits used for this video: <strong>{creditCents(estimate.totalCents)}</strong></p>
      <p className="hint small">xAI prepaid credits are measured in USD: 0.46 USD credits means 0.46 deducted from your prepaid balance. There is no separate points conversion. This is an estimate; credits actually used appear after generation. Each new generation uses credits.</p></>}
      <button type="submit" className="primary" disabled={!photo || !promptText.trim() || active}>{busy ? "Please wait…" : job ? "Review credits for another video" : "Review generation credits"}</button>
    </form>
    {error && <p role="alert" className="error">{error}</p>}
    {job && ((job.ceremony === "story") === storyMode) && <section className="ai-job-result" aria-label="Video generation result">
      <p role="status">{job.state === "done" ? "Video ready" : job.state === "pending" ? "Generating your video. This may take several minutes." : job.state === "starting" ? "Submission in progress. Check progress if it was interrupted; do not submit again." : "Generation stopped. Review the message before starting again."}</p>
      {Number.isFinite(job.actualCostUsd) ? <p><strong>API credits used for this {job.seconds || 15}-second clip: {creditUnits(job.actualCostUsd)}</strong><br /><small>Actual usage reported by xAI for this generation.</small></p> : Number.isFinite(job.estimatedCents) && <p>Estimated API credits for this request: {creditCents(job.estimatedCents)}. Actual credits used have not been returned by xAI yet.</p>}
      {job.videoUrl && <>{!renderEditor && <video controls muted playsInline src={job.videoUrl} className="ai-generated-video" />}<p><a href={job.videoUrl} target="_blank" rel="noopener noreferrer">Open / save generated MP4 →</a></p><p className="hint small">Save your clip while the provider link is available. Edit names, dates and venues in the reel form. Your video appears in the phone preview.</p></>}
      {chargeMessage && <p role="status" className="hint">{chargeMessage}</p>}
      {token && job.state === "done" && !Number.isFinite(job.actualCostUsd) && <button type="button" disabled={refreshingCharge} onClick={refreshCharge}>{refreshingCharge ? "Checking credits used…" : "Refresh credits used"}</button>}
      {token && !polling && ["pending", "starting"].includes(job.state) && <button type="button" onClick={() => { setError(""); setPolling(true); }}>Check progress</button>}
      {!["pending", "starting"].includes(job.state) && <button type="button" onClick={resetJob}>Start another clip</button>}
    </section>}
    {!storyMode && visibleClips.length>0 && <button type="button" className="primary" disabled={active} onClick={continueVideo}>＋ Continue video · next 15 seconds</button>}
    {storyMode && visibleClips.length>0 && <button type="button" className="primary" disabled={active} onClick={continueStory}>＋ Continue story · next 15 seconds</button>}
    <AiReelCost clips={visibleClips} />
    {clips.some(c=>c.token && !Number.isFinite(c.actualCostUsd)) && <button type="button" disabled={!accessReady || refreshingReelCost} onClick={refreshReelCost}>{refreshingReelCost ? "Checking reel credits…" : "Refresh full reel credits used"}</button>}


    {(clips.length > 0 || renderEditor) && (renderEditor ? renderEditor(<AiReelEditor {...editorProps} compact loadClip={loadClip} accessCode={config?.accessRequired === false ? "local" : accessCode} clips={visibleClips} onRemove={i => setClips(list => list.filter(c => c.videoUrl !== visibleClips[i]?.videoUrl))} />) : <AiReelEditor loadClip={loadClip} accessCode={accessCode} clips={visibleClips} onRemove={i => setClips(list => list.filter((_,j) => i !== j))} />)}
    <GenerationCostDialog quote={quote} generationAvailable={!!quote?.token && !!config?.ready} busy={busy} onCancel={() => setQuote(null)} onConfirm={generate} />
  </section>;
}
