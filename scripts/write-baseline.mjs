import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {dirname} from 'node:path';
/** Preserve unchanged files (including APFS clone sharing) during explicit
 * candidate generation. This never replaces capture, guards or exact comparison.
 * @param {string} path
 * @param {Uint8Array} image
 */
export function writeBaseline(path,image){
 try{if(readFileSync(path).equals(image))return false;}
 catch(error){if(!(error instanceof Error&&'code' in error&&error.code==='ENOENT'))throw error;}
 mkdirSync(dirname(path),{recursive:true});writeFileSync(path,image);return true;
}
