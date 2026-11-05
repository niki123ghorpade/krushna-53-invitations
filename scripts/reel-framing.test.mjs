import test from 'node:test';
import assert from 'node:assert/strict';
import {fullSceneRect,drawFullScene} from '../lib/reel-framing.mjs';
test('landscape source remains fully visible inside portrait reel',()=>{const rect=fullSceneRect(1920,1080);assert.equal(rect.width,720);assert.equal(rect.height,405);assert.equal(rect.x,0);assert.equal(rect.y,437.5);});
test('portrait and tall sources fit without cutting source edges',()=>{assert.deepEqual(fullSceneRect(720,1280),{x:0,y:0,width:720,height:1280});const r=fullSceneRect(600,1600);assert.equal(r.height,1280);assert.equal(r.width,480);assert.equal(r.x,120);});
test('sharp foreground uses the complete source image after the blurred background',()=>{const draws=[];const ctx={save(){},restore(){},fillRect(){},drawImage(...args){draws.push(args)}};const video={videoWidth:1920,videoHeight:1080};drawFullScene(ctx,video,720,1280);assert.equal(draws.length,2);assert.deepEqual(draws.at(-1),[video,0,437.5,720,405]);});
