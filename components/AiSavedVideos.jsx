"use client";
import { useEffect, useRef, useState } from "react";
import { creditUnits } from "@/lib/ai-credits.mjs";
function SavedVideoCard({clip,onUse,onEdit,disabled,loadClip,onUnavailable}) {
  const [url,setUrl]=useState(""),[loading,setLoading]=useState(false),[ready,setReady]=useState(false),[playing,setPlaying]=useState(false),[error,setError]=useState("");
  const mounted=useRef(true),objectUrl=useRef(""),video=useRef(null),card=useRef(null),fallbackTried=useRef(false);
  useEffect(()=>{
    mounted.current=true;
    const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){setUrl(clip.videoUrl);observer.disconnect();}},{rootMargin:"120px"});
    if(card.current)observer.observe(card.current);
    return()=>{mounted.current=false;observer.disconnect();if(objectUrl.current)URL.revokeObjectURL(objectUrl.current);};
  },[clip.videoUrl]);
  const title=clip.editableDetails?.title || clip.storyScene?.title || clip.ceremony;
  async function preview(){if(loading)return;setLoading(true);setError("");try{const blob=await loadClip(clip,AbortSignal.timeout(20000));if(!mounted.current)return;const next=URL.createObjectURL(blob);if(objectUrl.current)URL.revokeObjectURL(objectUrl.current);objectUrl.current=next;setUrl(next);}catch(e){if(mounted.current){if(e.code === "VIDEO_EXPIRED")onUnavailable(clip.videoUrl);else setError("Preview temporarily unavailable. Retry when the connection recovers.");}}finally{if(mounted.current)setLoading(false);}}
  function failed(){setReady(false);if(!fallbackTried.current){fallbackTried.current=true;void preview();}else setError("This preview could not be decoded. Retry preview.");}
  return <article ref={card} className="ai-saved-card"><div className="ai-saved-media">
    {url&&<video ref={video} src={url} controls={playing} muted loop playsInline preload="metadata" onLoadedMetadata={e=>{e.currentTarget.currentTime=Math.min(.2,(e.currentTarget.duration||1)/2);}} onLoadedData={()=>setReady(true)} onSeeked={()=>setReady(true)} onPlay={()=>setPlaying(true)} onPause={()=>setPlaying(false)} onError={failed} aria-label={"Saved video "+title}/>}
    {ready&&!playing&&<button type="button" className="ai-saved-play-overlay" disabled={disabled} onClick={()=>video.current?.play().catch(()=>setError("Tap the video again to play."))} aria-label={"Play preview "+title}><span className="ai-saved-play" aria-hidden="true">▶</span><span className="sr-only">Play video preview</span></button>}
    {!ready&&<button type="button" className="ai-saved-preview" disabled={loading||disabled||!error} onClick={preview} aria-label={"Preview "+title}><span className="ai-saved-play" aria-hidden="true">▶</span><span>{error?"Retry preview":"Loading video…"}</span><small>{clip.seconds}s · {clip.resolution}</small></button>}
  </div>{error&&<p className="ai-saved-error" role="status">{error}</p>}<p className="hint small ai-saved-usage">{Number.isFinite(clip.actualCostUsd)?"Used "+creditUnits(clip.actualCostUsd):"Credits used pending"}</p><label>Video heading<input disabled={disabled} maxLength={80} value={clip.editableDetails?.title ?? clip.storyScene?.title ?? clip.ceremony} onChange={e=>onEdit(clip.id,{...clip.editableDetails,title:e.target.value})}/></label><button type="button" className="primary" disabled={disabled||!ready||loading} onClick={()=>onUse(clip)}>Edit video</button></article>;
}

export default function AiSavedVideos({ clips, loading, error, onRefresh, onUse, onEdit, disabled, story=false,loadClip,onUnavailable }) {
  if(!clips.length)return null;
  return <section className="ai-saved-videos" aria-label="Previously generated videos"><div className="ai-saved-heading"><h3>{story?"Your generated stories":"Your generated videos"}</h3><button type="button" disabled={loading||disabled} onClick={onRefresh}>{loading?"Loading…":"Refresh videos"}</button></div><p className="hint small">Preview or edit a saved video. Text edits use no generation credits.</p><p className="ai-saved-swipe hint small">Swipe to browse videos →</p>{error&&<p role="status" className="hint">{error}</p>}<div className="ai-saved-grid" aria-label="Saved video gallery" tabIndex={0}>{clips.map(clip=><SavedVideoCard key={clip.id} clip={clip} onUse={onUse} onEdit={onEdit} disabled={disabled} loadClip={loadClip} onUnavailable={onUnavailable}/>)}</div></section>;
}
