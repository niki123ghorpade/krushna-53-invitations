export const DEFAULT_LETTERING={heading:58,address:36,font:'Invitation script',backdrop:'fade',surface:'banner',nameOrder:'groom'};
// Script font used for headings on decorated surfaces; loaded in the browser from /fonts/sacred.
export const REEL_SCRIPT_FONT='Reel Script';
export const LETTER_SURFACES=['none','banner','board','maroon','teal','ivory','glass','arch'];
// Cards in the lower half of the reel; they share the board's shape and differ in colour.
export const BOARD_LOOKS={
 board:{fill:'rgba(18,14,20,.93)',stroke:'#c9a24a',colours:{heading:'#e9c46a',names:'#fff8ea',text:'#f3e6cc'}},
 maroon:{fill:'rgba(96,14,32,.97)',stroke:'#d9b45a',colours:{heading:'#f1cf7a',names:'#fff4e2',text:'#f7e3c6'}},
 teal:{fill:'rgba(9,70,74,.97)',stroke:'#d9b45a',colours:{heading:'#f1cf7a',names:'#fff8ea',text:'#e9f3ef'}},
 ivory:{fill:'rgba(255,249,236,.96)',stroke:'#b99053',colours:{heading:'#8c1c2b',names:'#3a2418',text:'#4a3020'}},
 glass:{fill:'rgba(255,255,255,.84)',stroke:'rgba(255,255,255,.95)',colours:{heading:'#7a1426',names:'#2b1a14',text:'#3a2a20'}},
};
export const LETTER_COLOURS={gold:'#ffe3a0',white:'#ffffff',ivory:'#fff5df',champagne:'#f7e1b5',blush:'#ffd6e0',rosegold:'#f6c3a8',mint:'#d8f3e4'};
// 'Invitation script' pairs a calligraphy script for headings and names with a classic serif for details,
// like a printed wedding card. Both fonts are loaded in the browser from /fonts/invite.
export const INVITE_SCRIPT_FONT='Invite Script', INVITE_SERIF_FONT='Invite Serif';
// Wedding-card font pairs: a calligraphy script for headings and names with a serif for the details.
// scale evens out how large each script looks at the same size.
export const FONT_PAIRS={
 'Invitation script':{label:'Invitation script · Pinyon Script + Crimson Text',script:INVITE_SCRIPT_FONT,serif:INVITE_SERIF_FONT,scale:1},
 'Royal script':{label:'Royal script · Great Vibes + Cormorant',script:'Royal Script',serif:'Cormorant Serif',scale:1},
 'Graceful script':{label:'Graceful script · Allura + EB Garamond',script:'Graceful Script',serif:'Garamond Serif',scale:1.08},
 'Parisienne':{label:'Parisienne · Parisienne + Cormorant',script:'Parisienne Script',serif:'Cormorant Serif',scale:0.92},
 'Elegant script':{label:'Elegant script · Italianno + EB Garamond',script:'Elegant Script',serif:'Garamond Serif',scale:1.32},
 'Brush script':{label:'Brush script · Alex Brush + Crimson Text',script:'Brush Script Pair',serif:INVITE_SERIF_FONT,scale:1},
 'Classic italic':{label:'Classic italic · Playfair Display + Crimson Text',script:'Classic Italic',serif:INVITE_SERIF_FONT,scale:0.82},
};
// Font files in /fonts/invite, loaded by the reel editor: [family, file, style].
export const FONT_FILES=[
 [INVITE_SCRIPT_FONT,'PinyonScript-Regular.woff2'],[INVITE_SERIF_FONT,'CrimsonText-Regular.woff2'],[INVITE_SERIF_FONT,'CrimsonText-Italic.woff2','italic'],
 ['Royal Script','GreatVibes-Regular.woff2'],['Cormorant Serif','CormorantGaramond-Medium.woff2'],['Cormorant Serif','CormorantGaramond-MediumItalic.woff2','italic'],
 ['Graceful Script','Allura-Regular.woff2'],['Garamond Serif','EBGaramond-Regular.woff2'],['Garamond Serif','EBGaramond-Italic.woff2','italic'],
 ['Parisienne Script','Parisienne-Regular.woff2'],['Elegant Script','Italianno-Regular.woff2'],['Brush Script Pair','AlexBrush-Regular.woff2'],['Classic Italic','PlayfairDisplay-Italic.woff2'],
];
export const LETTER_FONTS=[...Object.keys(FONT_PAIRS),'Georgia','Times New Roman','Palatino Linotype','Arial','Trebuchet MS','Verdana'];
const MONTHS=['January','February','March','April','May','June','July','August','September','October','November','December'];
// "2026-12-24" -> "24th December 2026"; any other text is shown unchanged.
export function formatReelDate(value){
 const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || '').trim());
 if(!m)return String(value || '').trim();
 const day=Number(m[3]),month=Number(m[2]);
 if(month<1||month>12||day<1||day>31)return m[0];
 const suffix=day%100>=11&&day%100<=13?'th':({1:'st',2:'nd',3:'rd'}[day%10] || 'th');
 return day+suffix+' '+MONTHS[month-1]+' '+m[1];
}
// "19:30" -> "7:30 PM", "00:15" -> "12:15 AM"; any other text is shown unchanged.
export function formatReelTime(value){
 const m=/^(\d{1,2}):(\d{2})(?::\d{2})?$/.exec(String(value || '').trim());
 if(!m)return String(value || '').trim();
 const hour=Number(m[1]);if(hour>23||Number(m[2])>59)return m[0];
 return (hour%12 || 12)+':'+m[2]+' '+(hour<12?'AM':'PM');
}
export function reelEditKey({clips=[],...settings}){
 return JSON.stringify({...settings,clips:clips.map(c=>({videoUrl:c.videoUrl,ceremony:c.ceremony,editableDetails:c.editableDetails,storyScene:c.storyScene,weddingScenes:c.weddingScenes,weddingLayout:c.weddingLayout}))});
}
function lines(ctx,text,width){
 const words=String(text || '').trim().split(/\s+/),result=[];let line='';
 for(const word of words){const next=line?line+' '+word:word;if(line&&ctx.measureText(next).width>width){result.push(line);line=word;}else line=next;}if(line)result.push(line);return result;
}
export function addressLines(ctx,text,width){
 const value=String(text || '').trim();if(!value)return [];
 // A typed line break (Enter, | or a gap of two or more spaces) is kept as written.
 if(/[|\n]| {2,}/.test(value))return value.split(/\s*[|\n]\s*| {2,}/).filter(Boolean).flatMap(part=>lines(ctx,part,width));
 // Two-line addresses break at the comma nearest the middle, e.g. "Pool Deck," / "Bel-La Monde, NH8".
 if(value.length>16&&value.length<=65&&ctx.measureText(value).width>width*0.8){
  const commas=[...value.matchAll(/,/g)].map(m=>m.index).filter(i=>i>0&&i<value.length-1);
  const best=commas.sort((p,q)=>Math.abs(p-value.length/2)-Math.abs(q-value.length/2))[0];
  if(best!==undefined){const parts=[value.slice(0,best+1).trim(),value.slice(best+1).trim()];if(parts.every(part=>ctx.measureText(part).width<=width))return parts;}
 }
 const target=value.length>65?3:value.length>16?2:1;
 const balancedWidth=Math.min(width,Math.max(Math.min(width,160),ctx.measureText(value).width/target*(target===2?1.25:1.12)));
 let wrapped=lines(ctx,value,balancedWidth);
 if(wrapped.length>3)wrapped=lines(ctx,value,width);
 // Do not silently discard lines of a long address.
 return wrapped;
}
// Let each ritual play before its invitation copy appears. The action is visible
// first, then the ceremony details fade in during the same scene.
export function occasionRevealProgress(progress){
 const value=Number(progress);
 if(!Number.isFinite(value)||value<=0.3)return 0;
 return Math.min(1,(value-0.3)/0.14);
}
export function drawReelLettering(ctx,{event,names,look='gold',lettering=DEFAULT_LETTERING,panel=false,reveal=1}){
 const opacity=Math.max(0,Math.min(1,Number(reveal)));
 if(opacity===0)return;
 const pair=FONT_PAIRS[lettering.font],invite=Boolean(pair),scale=pair?.scale || 1;
 const font=invite?"'"+pair.serif+"', Georgia":LETTER_FONTS.includes(lettering.font)?lettering.font:'Georgia';
 const heading=[40,48,58,68].includes(Number(lettering.heading))?Number(lettering.heading):58;
 const address=[26,30,36,42].includes(Number(lettering.address))?Number(lettering.address):36;
 // Names and date follow the heading size (58 -> 34 and 30, as before).
 const nameSize=Math.round(heading*34/58),dateSize=Math.round(heading*30/58);
 const backdrop=['fade','strong','box','none'].includes(lettering.backdrop)?lettering.backdrop:'fade';
 // Full-scene text is queued first so a background box can be sized to the text before it is drawn.
 const surface=!panel&&LETTER_SURFACES.includes(lettering.surface)?lettering.surface:'none';
 let role='text';
 // Printed-card layout: roomier script heading and names, a small gold divider, spaced capitals for the date.
 const card=!panel&&invite&&surface!=='none';
 // Compact cards (default) use smaller text and tighter spacing so the video above stays visible.
 const compact=card&&lettering.cardSize!=='large';
 const addr=compact?Math.round(address*0.8):address,lineGap=compact?6:14,lineHeight=compact?1.1:1.2;
 const queue=[],draw=panel?(t,px,py,w)=>ctx.fillText(t,px,py,w):(t,px,py,w)=>queue.push({t,px,py,w,font:ctx.font,role,spacing:letterSpacing});
 let letterSpacing='0px';
 const boardLook=BOARD_LOOKS[surface];
 const startY=boardLook?900:{none:100,banner:96,arch:430}[surface];
 const x=panel?197:360,width=panel?280:boardLook?644:({none:650,banner:600,arch:420}[surface]);let y=panel?415:startY;
 const scriptFont="'"+(pair?.script || INVITE_SCRIPT_FONT)+"', Georgia";
 const headingFont=invite?scriptFont:surface==='none'?font:"'"+REEL_SCRIPT_FONT+"', "+font,headingSize=invite?Math.round(heading*(compact?1.02:card?1.32:1.2)*scale):surface==='none'?heading:Math.round(heading*1.15);
 ctx.save();
 ctx.globalAlpha=opacity;
 if(panel){ctx.fillStyle='rgba(255,248,232,.96)';ctx.fillRect(25,290,344,830);ctx.strokeStyle='#b99053';ctx.lineWidth=3;ctx.strokeRect(37,304,320,802);ctx.fillStyle=look==='gold'?'#71322b':'#292044';}

 ctx.textAlign='center';
 function block(text,size,maxLines,family=font){ctx.font=size+'px '+family;const wrapped=lines(ctx,text,width);for(const line of wrapped.slice(0,maxLines)){draw(line,x,y,width);y+=size*lineHeight;}y+=lineGap;}
 const when=[formatReelDate(event.date),formatReelTime(event.time)].filter(Boolean).join(' · ');
 if(card){
  // Shrink a long heading or names a little so they stay on one line and the card stays short.
  const fit=(text,size,family)=>{ctx.font=size+'px '+family;const w=ctx.measureText(String(text||'')).width;return w>width?Math.max(Math.round(size*0.7),Math.floor(size*width/w)):size;};
  y+=compact?2:18;role='heading';const hs=fit(event.title,headingSize,headingFont);y+=hs-headingSize;block(event.title,hs,2,headingFont);y-=4;
  role='names';block(names,fit(names,Math.round(nameSize*(compact?1.3:1.7)*scale),scriptFont),2,scriptFont);
  queue.push({divider:true,py:y-(compact?6:10)});y+=compact?26:38;
  role='heading';letterSpacing='3px';block(when.toUpperCase(),Math.round(dateSize*(compact?0.76:0.92)),1);letterSpacing='0px';role='text';y+=2;
 }else{
 role='heading';block(event.title,headingSize,2,headingFont);role='text';if(invite)block(names,Math.round(nameSize*1.45*scale),panel?3:2,scriptFont);else block(names,nameSize,panel?3:2);
 block(when,dateSize,panel?2:1);
 }
 ctx.font=addr+'px '+font;
 let venueLines=addressLines(ctx,event.venue,width);
 if(panel&&venueLines.length>3){
  venueLines=addressLines(ctx,event.venue,650);
  const lineHeight=address*1.2,top=Math.max(700,1230-venueLines.length*lineHeight);
  ctx.fillStyle='rgba(20,11,25,.85)';ctx.fillRect(16,top-address-12,688,venueLines.length*lineHeight+address+24);
  ctx.fillStyle='#fff5df';ctx.shadowColor='#000';ctx.shadowBlur=5;
  venueLines.forEach((line,i)=>ctx.fillText(line,360,top+i*lineHeight,650));
 }else{venueLines.forEach(line=>{draw(line,x,y,width);y+=addr*lineHeight;});}
 // Optional dress-code theme for the ceremony, shown under the venue like the other details.
 if(String(event.theme || '').trim()){ctx.font='italic '+Math.round(addr*0.9)+'px '+font;y+=compact?2:6;for(const line of lines(ctx,'Theme: '+String(event.theme).trim(),width).slice(0,2)){draw(line,x,y,width);y+=addr*1.1;}}
 if(!panel&&surface!=='none'){
  // Lift the board or arch when long text would run past the bottom of the reel.
  let top=startY;const pad=boardLook?34:surface==='arch'?74:0,lift=boardLook?(lettering.cardPosition==='top'?startY-80-24:y+pad-1252):pad?Math.max(0,y+pad-1262):0; // lower-half cards sit at the bottom so more of the video shows
  if(lift){top-=lift;y-=lift;for(const q of queue)q.py-=lift;}
  drawSurface(ctx,surface,top,y);const colours=boardLook?boardLook.colours:{heading:'#8c1c2b',names:'#3a2418',text:'#4a3020'};ctx.shadowBlur=0;for(const q of queue){if(q.divider){drawDivider(ctx,360,q.py,colours.heading);continue;}ctx.font=q.font;if('letterSpacing' in ctx)ctx.letterSpacing=q.spacing || '0px';ctx.fillStyle=colours[q.role] || colours.text;ctx.fillText(q.t,q.px,q.py,q.w);}if('letterSpacing' in ctx)ctx.letterSpacing='0px';}
 else if(!panel){
  const bottom=Math.max(200,y);
  if(backdrop==='fade'||backdrop==='strong'){const end=backdrop==='strong'?Math.max(610,bottom+140):610,gradient=ctx.createLinearGradient(0,0,0,end);gradient.addColorStop(0,backdrop==='strong'?'#140b19f0':'#140b19dd');if(backdrop==='strong')gradient.addColorStop(.7,'#140b19b0');gradient.addColorStop(1,'#140b1900');ctx.fillStyle=gradient;ctx.fillRect(0,0,720,end);}
  else if(backdrop==='box'){ctx.fillStyle='rgba(20,11,25,.55)';const top=40,h=bottom-top+10,r=28;ctx.beginPath();if(ctx.roundRect)ctx.roundRect(28,top,664,h,r);else ctx.rect(28,top,664,h);ctx.fill();}
  ctx.fillStyle=LETTER_COLOURS[look] || LETTER_COLOURS.gold;ctx.shadowColor='#000';ctx.shadowBlur=backdrop==='none'?14:8;
  for(const q of queue){ctx.font=q.font;ctx.fillText(q.t,q.px,q.py,q.w);}
 }
 ctx.restore();
}

// Decorated surfaces behind the ceremony text, like a printed invitation: a cream banner at the top,
// a dark board in the lower half, or an arched cream card in the middle.
// Thin gold rule with a small diamond in the middle, used between the names and the date.
function drawDivider(ctx,cx,cy,colour){ctx.save();ctx.strokeStyle=colour;ctx.fillStyle=colour;ctx.lineWidth=1.5;ctx.globalAlpha*=0.9;ctx.beginPath();ctx.moveTo(cx-120,cy);ctx.lineTo(cx-14,cy);ctx.moveTo(cx+14,cy);ctx.lineTo(cx+120,cy);ctx.stroke();ctx.beginPath();ctx.moveTo(cx,cy-7);ctx.lineTo(cx+7,cy);ctx.lineTo(cx,cy+7);ctx.lineTo(cx-7,cy);ctx.closePath();ctx.fill();ctx.restore();}
function roundedRect(ctx,x,y,w,h,r){ctx.beginPath();if(ctx.roundRect)ctx.roundRect(x,y,w,h,r);else ctx.rect(x,y,w,h);}
function drawSurface(ctx,surface,startY,endY){
 ctx.save();ctx.shadowColor='rgba(0,0,0,.35)';ctx.shadowBlur=18;
 if(surface==='banner'){const top=28,h=Math.max(220,endY-top+14);const g=ctx.createLinearGradient(0,top,0,top+h);g.addColorStop(0,'#fffaf0');g.addColorStop(1,'#f1e0bd');ctx.fillStyle=g;roundedRect(ctx,18,top,684,h,20);ctx.fill();ctx.shadowBlur=0;ctx.strokeStyle='#b99053';ctx.lineWidth=4;roundedRect(ctx,18,top,684,h,20);ctx.stroke();ctx.lineWidth=1.5;roundedRect(ctx,30,top+12,660,h-24,14);ctx.stroke();ctx.fillStyle='#b99053';for(const [cx,cy] of [[46,top+28],[674,top+28],[46,top+h-28],[674,top+h-28]]){ctx.beginPath();ctx.moveTo(cx,cy-9);ctx.lineTo(cx+9,cy);ctx.lineTo(cx,cy+9);ctx.lineTo(cx-9,cy);ctx.closePath();ctx.fill();}}
 else if(BOARD_LOOKS[surface]){const look=BOARD_LOOKS[surface],top=startY-80,h=Math.max(240,endY-top+20);ctx.fillStyle=look.fill;roundedRect(ctx,16,top,688,h,26);ctx.fill();ctx.shadowBlur=0;ctx.strokeStyle=look.stroke;ctx.lineWidth=5;roundedRect(ctx,16,top,688,h,26);ctx.stroke();ctx.lineWidth=1.5;roundedRect(ctx,30,top+14,660,h-28,18);ctx.stroke();}
 else if(surface==='arch'){const top=startY-170,bottom=Math.max(startY+260,endY+60),cy=top+250;const g=ctx.createLinearGradient(0,top,0,bottom);g.addColorStop(0,'#fffaf0');g.addColorStop(1,'#f3e6c9');const path=()=>{ctx.beginPath();ctx.moveTo(110,bottom);ctx.lineTo(110,cy);ctx.arc(360,cy,250,Math.PI,0);ctx.lineTo(610,bottom);ctx.closePath();};ctx.fillStyle=g;path();ctx.fill();ctx.shadowBlur=0;ctx.strokeStyle='#b99053';ctx.lineWidth=5;path();ctx.stroke();ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(126,bottom-14);ctx.lineTo(126,cy);ctx.arc(360,cy,234,Math.PI,0);ctx.lineTo(594,bottom-14);ctx.closePath();ctx.stroke();}
 ctx.restore();
}
