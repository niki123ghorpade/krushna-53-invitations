export const REEL_EXPORTS = {
  standard: {label:'Compact · 720p · smaller file',bitrate:2000000},
  high: {label:'High quality · 720p · larger file',bitrate:4000000},
};
// requestedEnd (optional) keeps only the part of a clip before that second, e.g. the baraat part of a longer reel.
export function clipWindow(duration, requestedStart=0.6, requestedEnd=0){
  const full=Number.isFinite(duration)&&duration>0?duration:0, stop=Number(requestedEnd);
  const end=Number.isFinite(stop)&&stop>0?Math.min(full,Math.max(stop,Math.min(full,(Number(requestedStart)||0)+0.25))):full;
  const start=Math.min(Math.max(0,Number(requestedStart)||0),Math.max(0,end-0.25));
  return {start,duration:end-start};
}
export function estimatedReelMegabytes(seconds,quality='standard',audio=true){
  return Math.max(0,seconds)*((REEL_EXPORTS[quality]||REEL_EXPORTS.standard).bitrate+(audio?128000:0))/8000000;
}
