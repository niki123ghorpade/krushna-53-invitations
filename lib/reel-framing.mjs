export function fullSceneRect(sourceWidth,sourceHeight,width=720,height=1280){
 if(![sourceWidth,sourceHeight,width,height].every(n=>Number.isFinite(n)&&n>0))throw new Error('Invalid video dimensions');
 const scale=Math.min(width/sourceWidth,height/sourceHeight),w=sourceWidth*scale,h=sourceHeight*scale;
 return {x:(width-w)/2,y:(height-h)/2,width:w,height:h};
}
export function drawFullScene(ctx,video,width,height){
 const rect=fullSceneRect(video.videoWidth,video.videoHeight,width,height);
 ctx.save();ctx.fillStyle='#171127';ctx.fillRect(0,0,width,height);
 if(rect.width<width-.5 || rect.height<height-.5){
  const backgroundScale=Math.max((width+64)/video.videoWidth,(height+64)/video.videoHeight),w=video.videoWidth*backgroundScale,h=video.videoHeight*backgroundScale;
  ctx.save();ctx.filter='blur(24px)';ctx.drawImage(video,(width-w)/2,(height-h)/2,w,h);ctx.restore();ctx.fillStyle='rgba(23,17,39,.28)';ctx.fillRect(0,0,width,height);
 }
 ctx.drawImage(video,rect.x,rect.y,rect.width,rect.height);ctx.restore();return rect;
}
