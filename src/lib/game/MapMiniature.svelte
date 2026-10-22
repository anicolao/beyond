<script lang="ts">
 import {base} from '$app/paths';
 let {art,width}:{art:string;width:20|23}=$props();
 const source=$derived(`${base}/art/card-thumbnails/${art}-${width}x12.png`);
 const sources=$derived(`${base}/art/card-thumbnails/${art}-${width*2}x24.png 2x, ${base}/art/card-thumbnails/${art}-${width*3}x36.png 3x`);
 let loadedSource=$state(''),loadedFor=$state('');
 const texture=$derived(loadedFor===source?loadedSource:source);
 function loaded(event:Event){
  const image=event.currentTarget as HTMLImageElement;
  loadedSource=image.currentSrc;loadedFor=source;
 }
</script>

<!-- The responsive image loads the original-art derivative; the inset paints
     that same resource as its texture, including in turned physical readers. -->
<span class="miniature" aria-hidden="true" style:background-image={`url('${texture}')`}>
 <img src={source} srcset={sources} {width} height="12" alt="" onload={loaded}/>
</span>

<style>
 .miniature{display:block;width:100%;height:100%;background-position:center;background-size:cover;background-repeat:no-repeat}
 img{display:block;width:100%;height:100%;object-fit:cover;opacity:0}
</style>
