import {statfsSync} from 'node:fs';
/** Keep all rendering flags intact; only select the verified Linux CI backing store. */
export function browserSharedMemory({platform=process.platform,ci=process.env.CI,stat=statfsSync}={}){
 if(platform!=='linux'||ci!=='true')return {ignoreDefaultArgs:[]};
 const fs=stat('/dev/shm'),bytes=Number(fs.bsize)*Number(fs.blocks);
 if(Number(fs.type)!==0x01021994||bytes<256*1024*1024)throw new Error('Pinned browser CI requires at least256MiB of memory-backed /dev/shm.');
 console.info('Browser host shared memory bytes:',bytes);
 return {ignoreDefaultArgs:['--disable-dev-shm-usage']};
}
