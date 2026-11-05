"use client";
import { useEffect, useRef, useState } from "react";
import { download, readSavedDetails } from "@/components/ui";
import {drawFullScene} from "@/lib/reel-framing.mjs";
import AiReelCost from "@/components/AiReelCost";
import SocialShareActions from "@/components/SocialShareActions";

const defaults = [
  ["Shri Ganeshaya Namah", "", "", ""],
  ["Mehendi", "2027-02-12", "16:00", "Shree Krishna Lawns, Pune"],
  ["Haldi", "2027-02-13", "10:00", "Shree Krishna Lawns, Pune"],
  ["Sangeet", "2027-02-13", "19:00", "Shree Krishna Lawns, Pune"],
  ["Wedding", "2027-02-14", "11:30", "Shree Krishna Lawns, Pune"],
  ["Reception", "2027-02-14", "19:30", "Shree Krishna Lawns, Pune"],
].map(([title,date,time,venue]) => ({ title,date,time,venue }));
const plans = { "journey-opening": [[0,4/15,0],[4/15,9/15,1],[9/15,1,2]], "journey-finale": [[0,4/15,3],[4/15,11/15,4],[11/15,1,5]] };
export default function AiReelEditor({ clips, onRemove, loadClip, accessCode, compact = false, details: sharedDetails, events: sharedEvents, music }) {
  const canvas = useRef(null), video = useRef(null), frame = useRef(0);
  const [names,setNames] = useState(""), [events,setEvents] = useState(defaults), [look,setLook] = useState("gold"), [index,setIndex] = useState(0);
  const resolvedNames = sharedDetails ? [sharedDetails.brideName, sharedDetails.groomName].filter(Boolean).join(" & ") : names;
  const resolvedEvents = sharedDetails ? defaults.map((ev,i) => {
    if(i === 0) return {title:sharedDetails.blessing || ev.title,date:"",time:"",venue:""};
    const kind=["", "mehndi","haldi","sangeet","wedding","reception"][i];
    const event=sharedEvents?.find(e=>e.kind===kind);
    return {...ev,title:kind === "wedding" ? sharedDetails.title || ev.title : ev.title,date:event?.date || sharedDetails.date,time:event?.time || sharedDetails.time,venue:event?.venue || [sharedDetails.venue,sharedDetails.city].filter(Boolean).join(", ")};
  }) : events;
  const [busy,setBusy] = useState(false), [progress,setProgress] = useState(0), [error,setError] = useState(""), [file,setFile] = useState(null);
  const restored=useRef(false);
  useEffect(() => { try { const saved=JSON.parse(sessionStorage.getItem("everymoment-ai-edit")||"null"); if(saved && typeof saved.names === "string" && Array.isArray(saved.events) && saved.events.length === 6) {setNames(saved.names);setEvents(saved.events);setLook(saved.look === "white"?"white":"gold");} else {const details=readSavedDetails();if(details)setNames([details.brideName,details.groomName].filter(Boolean).join(" & "));} }catch{} restored.current=true; },[]);
  useEffect(() => {if(restored.current)try{sessionStorage.setItem("everymoment-ai-edit",JSON.stringify({names,events,look}));}catch{}},[names,events,look]);
  useEffect(() => {setFile(null);},[names,events,look,clips,sharedDetails,sharedEvents,music]);
  const [sources,setSources]=useState([]), [combined,setCombined]=useState(true), [playing,setPlaying]=useState(true), [muted,setMuted]=useState(true), [position,setPosition]=useState(0);
  const desiredPlaying=useRef(true), pendingSeek=useRef(0), musicPreview=useRef({ctx:null,source:null});
  const [seekRevision,setSeekRevision]=useState(0);
  const selectedIndex=Math.min(index,Math.max(0,clips.length-1));
  const mediaKey=clips.map(c=>`${c.videoUrl}:${c.token || ""}`).join("|");
  const selected=clips[selectedIndex], previewUrl=sources[selectedIndex]?.url;
  const durations=clips.map((_,i)=>sources[i]?.duration || 15);
  const totalDuration=durations.reduce((a,b)=>a+b,0);
  const startOffset=durations.slice(0,selectedIndex).reduce((a,b)=>a+b,0);
  useEffect(() => {
    let alive=true;const urls=[];setSources([]);setPosition(0);
    Promise.all(clips.map(async clip=>{
      const blob=await loadClip(clip);if(!alive)return null;
      const url=URL.createObjectURL(blob);urls.push(url);
      const duration=await new Promise((resolve,reject)=>{const v=document.createElement("video");v.preload="metadata";v.onloadedmetadata=()=>{resolve(v.duration);v.removeAttribute("src");v.load();};v.onerror=()=>reject(new Error("Could not read clip duration."));v.src=url;});
      return {url,duration};
    })).then(next=>{if(alive){setSources(next);setError("");}}).catch(e=>{if(alive){setError(e.message);setPlaying(false);desiredPlaying.current=false;}});
    return()=>{alive=false;urls.forEach(URL.revokeObjectURL);};
  },[mediaKey,accessCode]); // eslint-disable-line react-hooks/exhaustive-deps
  function unlockMusic(){if(!compact)return;try{const state=musicPreview.current;if(!state.ctx)state.ctx=new AudioContext();void state.ctx.resume().catch(()=>{});}catch{}}
  useEffect(()=>{
    const state=musicPreview.current;
    if(video.current)video.current.muted=compact || muted;
    if(!compact || !music || muted || !playing || busy || !previewUrl)return;
    try{if(!state.ctx)state.ctx=new AudioContext();const source=state.ctx.createBufferSource();source.buffer=music;source.loop=true;source.connect(state.ctx.destination);source.start(0,(startOffset+(video.current?.currentTime || 0))%music.duration);state.source=source;void state.ctx.resume().catch(()=>{});return()=>{try{source.stop();source.disconnect();}catch{}if(state.source===source)state.source=null;};}catch{}
  },[compact,music,muted,playing,busy,selectedIndex,previewUrl,seekRevision]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(()=>()=>{const state=musicPreview.current;try{state.source?.stop();}catch{}void state.ctx?.close().catch(()=>{});},[]);
  function playback(value){if(value)unlockMusic();desiredPlaying.current=value;setPlaying(value);if(value)video.current?.play().catch(()=>{});else video.current?.pause();}
  function seekFull(t){setSeekRevision(n=>n+1);let i=0,local=t;while(i<durations.length-1&&local>=durations[i]){local-=durations[i];i++;}pendingSeek.current=local;setPosition(t);if(i===selectedIndex&&video.current)video.current.currentTime=local;else setIndex(i);}
  function playAll(){setCombined(true);seekFull(0);playback(true);}
  function clipEnded(){if(combined&&selectedIndex<clips.length-1){pendingSeek.current=0;setIndex(selectedIndex+1);}else playback(false);}
  function loadedPreview(){if(video.current){video.current.currentTime=pendingSeek.current;video.current.muted=compact || muted;setSeekRevision(n=>n+1);if(desiredPlaying.current)video.current.play().catch(()=>{});}}
  const stamp=t=>Math.floor(t/60)+":"+String(Math.floor(t%60)).padStart(2,"0");
  const previewControls=<><div className="preview-actions"><button type="button" disabled={busy||!sources.length} onClick={playAll}>▶ Play full reel</button><button type="button" disabled={busy||!sources.length} onClick={()=>playback(!playing)}>{playing?"❚❚ Pause":"▶ Play"}</button><button type="button" onClick={()=>{unlockMusic();setMuted(!muted);if(video.current)video.current.muted=compact || !muted;}}>{muted?"Sound off":"Sound on"}</button></div><label className="hint">{combined?"Combined preview":"Clip preview"} · {stamp(position)} / {stamp(totalDuration)}<input aria-label="Full reel position" type="range" min={0} max={totalDuration} step={0.1} value={Math.min(position,totalDuration)} disabled={busy||!sources.length} onChange={e=>{setCombined(true);seekFull(Number(e.target.value));}} style={{width:"100%"}}/></label></>;
  function paint(v,clip) {
    const c=canvas.current, ctx=c?.getContext("2d"); if(!ctx || !v.videoWidth) return;
    drawFullScene(ctx,v,c.width,c.height);
    const fraction=v.currentTime/(v.duration||15), plan=plans[clip.ceremony];
    const single={mehndi:1,haldi:2,sangeet:3,wedding:4,reception:5};
    const sceneEvent=resolvedEvents[plan ? (plan.find(([a,b])=>fraction>=a&&fraction<b)?.[2] ?? plan.at(-1)[2]) : (single[clip.ceremony]??4)];
    const baseEvent=sharedDetails && !plan ? {...sceneEvent,date:sharedDetails.date,time:sharedDetails.time,venue:[sharedDetails.venue,sharedDetails.city].filter(Boolean).join(", ")} : sceneEvent;
    const storyEvent=clip.storyScene?.scenes?.[Math.min(clip.storyScene.scenes.length-1,Math.floor(fraction*clip.storyScene.scenes.length))] || clip.storyScene;
    const ev={...baseEvent,...(storyEvent?{title:storyEvent.title || "Our story",date:storyEvent.date || "",time:"",venue:storyEvent.location || ""}:{}),...clip.editableDetails};
    const caption="";
    const gradient=ctx.createLinearGradient(0,0,0,470);gradient.addColorStop(0,"#140b19dd");gradient.addColorStop(1,"#140b1900");ctx.fillStyle=gradient;ctx.fillRect(0,0,720,470);
    ctx.textAlign="center";ctx.fillStyle=look==="gold"?"#ffe3a0":"#ffffff";ctx.shadowColor="#000";ctx.shadowBlur=8;
    ctx.font="38px Georgia";ctx.fillText(ev.title,360,95,650);
    ctx.font="29px Georgia";ctx.fillText(resolvedNames,360,150,650);
    if(caption){ctx.font="25px Georgia";const words=caption.split(/\s+/);let line="",lines=[];for(const word of words){if(ctx.measureText(line+" "+word).width>640){lines.push(line);line=word;}else line+=(line?" ":"")+word;}lines.push(line);lines.slice(0,2).forEach((text,i)=>ctx.fillText(text,360,196+i*34,650));}
    ctx.font="25px Georgia";ctx.fillText([ev.date,ev.time].filter(Boolean).join(" · "),360,caption?272:196,650);
    ctx.font="24px Georgia";ctx.fillText(ev.venue,360,caption?314:238,650);ctx.shadowBlur=0;
  }
  useEffect(() => {
    const draw=()=>{if(!busy&&video.current&&selected)paint(video.current,selected);frame.current=requestAnimationFrame(draw);};draw();return()=>cancelAnimationFrame(frame.current);
  },[selected,names,events,look,busy,sharedDetails,sharedEvents]); // eslint-disable-line react-hooks/exhaustive-deps
  async function exportVideo() {
    setBusy(true);setError("");setProgress(0);setFile(null);playback(false);
    const urls=[];let output;
    try {
      const mb=await import("mediabunny");const codec=await mb.getFirstEncodableVideoCodec(["avc"],{width:720,height:1280,frameRate:24});if(!codec)throw new Error("MP4 export needs a browser with H.264 encoding. Try current Chrome or Edge.");
      output=new mb.Output({format:new mb.Mp4OutputFormat({fastStart:"in-memory"}),target:new mb.BufferTarget()});
      const source=new mb.CanvasSource(canvas.current,{codec,bitrate:6000000});output.addVideoTrack(source,{frameRate:24});
      const loaded=[];
      for(const clip of clips){const url=URL.createObjectURL(await loadClip(clip));urls.push(url);const v=document.createElement("video");v.muted=true;v.preload="auto";v.src=url;await new Promise((resolve,reject)=>{v.onloadeddata=resolve;v.onerror=()=>reject(new Error("Clip could not be decoded."));});loaded.push({v,clip});}
      const total=loaded.reduce((s,{v})=>s+v.duration,0);
      const {generateMusic,musicForDuration}=await import("@/lib/music");const audio=compact ? await musicForDuration(music,total) : await generateMusic("festive",total);const ac=audio ? await mb.getFirstEncodableAudioCodec(["aac"],{numberOfChannels:audio.numberOfChannels,sampleRate:audio.sampleRate}) : null;let audioSource;if(ac){audioSource=new mb.AudioBufferSource({codec:ac,quality:mb.QUALITY_HIGH});output.addAudioTrack(audioSource);}
      await output.start();if(audioSource)await audioSource.add(audio);
      let offset=0;
      for(const {v,clip} of loaded){const frames=Math.ceil(v.duration*24);for(let f=0;f<frames;f++){const t=Math.min(f/24,Math.max(0,v.duration-.001));if(Math.abs(v.currentTime-t)>.0001)await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error("Video seeking timed out.")),15000);v.onseeked=()=>{clearTimeout(timer);resolve();};v.currentTime=t;});paint(v,clip);await source.add(offset+f/24,1/24);if(f%12===0){setProgress((offset+t)/total);await new Promise(r=>setTimeout(r,0));}}offset+=frames/24;}
      source.close();audioSource?.close();await output.finalize();const result=new File([output.target.buffer],"wedding-invitation-reel.mp4",{type:"video/mp4"});download(result,result.name);setFile(result);setProgress(1);
    }catch(e){await output?.cancel().catch(()=>{});setError(e.message||"Could not export this video. Try uploading the saved MP4.");}finally{urls.forEach(URL.revokeObjectURL);setBusy(false);}
  }
  if (compact) return <section aria-label="Generated video reel preview"><p className="preview-label">LIVE PREVIEW · FULL SCENE</p><div className="phone ai-preview-phone"><canvas ref={canvas} width={720} height={1280} className="invite-canvas" />{!selected && <div className="ai-empty-preview"><span aria-hidden="true">＋</span><p>Upload a photo to create your video</p><small>Your generated video will appear here</small></div>}</div>{selected && <video ref={video} src={previewUrl || undefined} playsInline muted style={{display:"none"}} onLoadedData={loadedPreview} onEnded={clipEnded} onTimeUpdate={()=>setPosition(startOffset+(video.current?.currentTime||0))} />}{previewControls}<AiReelCost clips={clips} seconds={totalDuration} /><div className="download-box">{clips.map((clip,i)=><button className="ai-clip-button" aria-pressed={selectedIndex === i} disabled={busy} type="button" key={clip.videoUrl} onClick={()=>{setCombined(false);pendingSeek.current=0;setIndex(i);playback(true);}}>Clip {i+1}: {clip.ceremony}</button>)}<button type="button" className="primary" disabled={busy||!clips.length} onClick={exportVideo}>{busy?`Making your reel… ${Math.round(progress*100)}%`:"↓ Download reel (MP4, 9:16 HD)"}</button>{error&&<p role="alert" className="error">{error}</p>}{file&&<SocialShareActions file={file} type="invitation reel"/>}</div></section>;
  return <section className="ai-reel-editor" aria-label="Edit generated reel"><h2>Create your reel</h2><p className="hint">Names, dates and venues below stay editable. Opening + finale clips together make the full wedding film. Export uses instrumental music from the site.</p>
    <div className="ai-editor-grid"><fieldset disabled={busy}><legend>Your invitation details</legend>
      <label>Couple names<input value={names} maxLength={80} onChange={e=>setNames(e.target.value)}/></label>
      <label>Lettering<select value={look} onChange={e=>setLook(e.target.value)}><option value="gold">Elegant gold</option><option value="white">Classic white</option></select></label>
      {events.map((ev,i)=><details key={i}><summary>{ev.title}</summary>{["title","date","time","venue"].map(key=><label key={key}>{key}<input type={key==="date"?"date":key==="time"?"time":"text"} maxLength={80} value={ev[key]} onChange={e=>setEvents(list=>list.map((v,j)=>j===i?{...v,[key]:e.target.value}:v))}/></label>)}</details>)}
      {clips.map((clip,i)=><p key={clip.videoUrl}><button type="button" onClick={()=>setIndex(i)}>Preview {i+1}: {clip.ceremony}</button> <button type="button" onClick={()=>{onRemove(i);setIndex(0);}}>Remove</button></p>)}
    </fieldset><div><canvas ref={canvas} width={720} height={1280} className="ai-editor-canvas"/>{selected&&<video key={selected.videoUrl} ref={video} src={previewUrl || undefined} controls playsInline muted={muted} onLoadedData={loadedPreview} onEnded={clipEnded} onPlay={()=>{desiredPlaying.current=true;setPlaying(true);}} onPause={()=>{if(!video.current?.ended){desiredPlaying.current=false;setPlaying(false);}}} onTimeUpdate={()=>setPosition(startOffset+(video.current?.currentTime||0))} className="ai-editor-source"/>}{previewControls}<AiReelCost clips={clips} seconds={totalDuration} /><p className="hint small">Use the video controls to play or scrub the preview above. The full scene stays visible; extra portrait space uses a blurred background.</p>
      <button type="button" className="primary" disabled={busy||!clips.length} onClick={exportVideo}>{busy?`Exporting ${Math.round(progress*100)}%` : "Download edited reel (MP4)"}</button>{error&&<p role="alert">{error}</p>}{file&&<SocialShareActions file={file} type="invitation reel"/>}
    </div></div></section>;
}
