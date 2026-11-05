import { SCENE_DESCRIPTION_LIMIT, CONTINUATION_SUMMARY_LIMIT, STORY_TEXT_LIMIT } from "./ai-video-limits.mjs";
export const STORY_STYLES = ["Illustrated romance", "Stylized 3D animation", "Watercolour storybook"];
export const STORY_STYLE_DETAILS = {
  "Illustrated romance":"Soft illustrated characters, clean outlines, warm cinematic colours and gentle expressive movement.",
  "Stylized 3D animation":"Rounded 3D animated characters, dimensional faces, soft material textures, cinematic lighting and expressive cartoon movement; avoid photorealistic skin.",
  "Watercolour storybook":"Hand-painted 2D storybook illustration, visible watercolour washes, delicate paper texture, pastel colours and gently animated painted characters."
};
export const newStoryEvent = () => ({ id: crypto.randomUUID(), title: "", description: "", location: "", date: "", caption: "" });
export function storyScenePrompt(event, { style = STORY_STYLES[0], seconds = 5, index = 0, count = 1 } = {}) {
  return `Create scene ${index + 1} of ${count} of a personal love-story film, ${seconds} seconds long, portrait 9:16. Use the supplied couple photo to preserve both people's recognizable facial features and consistent character designs. Visual style: ${style}; clearly animated illustrated characters rather than photorealistic footage. Scene title: ${event.title}. What happens: ${event.description}. ${event.location ? `Setting: ${event.location}.` : ""} Warm cinematic lighting, expressive eyes, natural blinking, silent smiles and gentle believable gestures. Establish the location and then use a slow camera move to follow the action. Leave the upper third clear for editable story captions. NO text, dates, names, captions, logos or watermarks inside the generated footage. No talking, dialogue, lip-sync, narration or singing. Instrumental romantic music only. No distorted faces or hands. Do not add an introductory photo slideshow. This is one scene; do not invent or skip other life events.`;
}
export function validStoryScene(value) {
  if (value === undefined) return true;
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const limits = { title: 80, caption: 160, location: 120, date: 20, projectId: 80, id: 80, previousSummary:CONTINUATION_SUMMARY_LIMIT, animation:100, storyText:STORY_TEXT_LIMIT };
  if(value.storyText !== undefined && (typeof value.storyText !== "string" || !value.storyText.trim())) return false;
  if(value.part !== undefined && (!Number.isInteger(value.part) || value.part < 1 || value.part > 100)) return false;
  if(value.scenes !== undefined && (!Array.isArray(value.scenes) || value.scenes.length < 1 || value.scenes.length > 6 || !value.scenes.every(scene => scene && typeof scene === "object" && ["id","title","description","location","date"].every(key => scene[key] === undefined || typeof scene[key] === "string" && scene[key].length <= ({id:80,title:80,description:SCENE_DESCRIPTION_LIMIT,location:120,date:20}[key]))))) return false;
  return Object.entries(limits).every(([key, limit]) => value[key] === undefined || typeof value[key] === "string" && value[key].length <= limit)
    && Number.isInteger(value.index) && value.index >= 0 && value.index < 6
    && Number.isInteger(value.count) && value.count >= 1 && value.count <= 6;
}

export function storyFilmPrompt(events, {style=STORY_STYLES[0],seconds=15,part=1,previousSummary=""}={}) {
  const freeform=typeof events === "string";
  const timeline=freeform?events:events.map((event,i)=>{
    const start=(i*seconds/events.length).toFixed(1),end=((i+1)*seconds/events.length).toFixed(1);
    return start+"–"+end+"s, scene "+(i+1)+": "+event.title+". "+event.description+" Keep this beat to one clear action; hold a readable medium shot before transitioning."+(event.location?" Setting: "+event.location+".":"");
  }).join("\n");
  return "Create ONE complete "+seconds+"-second vertical 9:16 animated personal love-story video containing "+(freeform?"all the moments in the story below, in their written order":"ALL "+events.length+" scenes below in this exact order")+". Total running time is "+seconds+" seconds, not per scene. Use the uploaded couple photo as the character reference throughout; preserve both people's recognizable facial features, with consistent illustrated character designs. Visual style: "+style+". "+(STORY_STYLE_DETAILS[style] || "")+" "+(part>1?"This is continuation part "+part+". Continue after these previous events: "+previousSummary+". Preserve the same couple identity and visual style; show only the NEW scenes below, with no recap or repeated intro. ":"")+"\n"+timeline+"\nRender native full-frame portrait 9:16 footage, without letterboxing, wide inset panels or split screens. Use stable medium or medium-wide shots showing both partners; avoid extreme close-ups and rapid zooms. Prioritise the main action of each beat within its allotted time instead of squeezing in extra gestures. Connect scenes with short, gentle transitions. Use restrained blinking, natural silent smiles and consistent faces and clothing within each beat. Do not repeat, omit or append scenes, and do not introduce wedding ceremonies unless described. No separate reference-photo intro. No text, captions, dates, logos or watermarks in footage; leave upper third clear for editable headings. No talking, dialogue, lip-sync, narration or singing; soft instrumental music only. No distorted faces or hands.";
}
