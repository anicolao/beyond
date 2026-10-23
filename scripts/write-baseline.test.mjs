import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync,statSync,utimesSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {writeBaseline} from './write-baseline.mjs';
test('candidate writer creates missing parents and writes every new byte',()=>{
 const root=mkdtempSync(join(tmpdir(),'beyond-baseline-'));
 try{const path=join(root,'story','frame.png'),image=Buffer.from([137,80,78,71,0,255]);assert.equal(writeBaseline(path,image),true);assert.deepEqual(readFileSync(path),image);}finally{rmSync(root,{recursive:true,force:true});}
});
test('identical candidate leaves the existing inode and fixed mtime unchanged',()=>{
 const root=mkdtempSync(join(tmpdir(),'beyond-baseline-'));
 try{const path=join(root,'frame.png'),image=Buffer.from([1,2,3]);writeBaseline(path,image);utimesSync(path,100,100);const before=statSync(path,{bigint:true});assert.equal(writeBaseline(path,image),false);const after=statSync(path,{bigint:true});assert.equal(after.ino,before.ino);assert.equal(after.mtimeNs,before.mtimeNs);assert.deepEqual(readFileSync(path),image);}finally{rmSync(root,{recursive:true,force:true});}
});
test('any byte or length change is written; filesystem errors fail instead of being skipped',()=>{
 const root=mkdtempSync(join(tmpdir(),'beyond-baseline-'));
 try{const path=join(root,'frame.png');writeBaseline(path,Buffer.from([1,2,3]));assert.equal(writeBaseline(path,Buffer.from([1,2,4])),true);assert.deepEqual(readFileSync(path),Buffer.from([1,2,4]));assert.equal(writeBaseline(path,Buffer.from([1,2])),true);assert.deepEqual(readFileSync(path),Buffer.from([1,2]));assert.throws(()=>writeBaseline(root,Buffer.from([1])),{code:'EISDIR'});}finally{rmSync(root,{recursive:true,force:true});}
});
test('different-sized stale candidates need no old-byte read, while the complete new bytes remain mandatory',async()=>{
 const fs=await import('node:fs'),{syncBuiltinESMExports}=await import('node:module'),root=mkdtempSync(join(tmpdir(),'beyond-baseline-'));
 const path=join(root,'frame.png'),next=Buffer.from([9,8,7,6]),original=fs.default.readFileSync;writeBaseline(path,Buffer.from([1,2]));let reads=0;
 try{fs.default.readFileSync=function(file,...args){if(file===path){reads++;throw new Error('Old blob must not be read when byte lengths differ');}return original.call(this,file,...args);};syncBuiltinESMExports();assert.equal(writeBaseline(path,next),true);assert.equal(reads,0);}
 finally{fs.default.readFileSync=original;syncBuiltinESMExports();}
 try{assert.deepEqual(readFileSync(path),next);}finally{rmSync(root,{recursive:true,force:true});}
});
