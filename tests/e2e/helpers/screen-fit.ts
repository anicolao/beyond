/** Warm current visible image decodes while the canonical acknowledgement is in
 * flight. This is an optimization only: assertScreenFit still decodes every
 * current visible image after acknowledgement, including late/replaced images. */
export async function warmVisibleImages() {
  const start=performance.now(),images=[...document.images].filter(image=>image.checkVisibility({visibilityProperty:true}));
  await Promise.all(images.map(image=>image.decode()));
  console.info('beyond-image-warm',JSON.stringify({elapsed:performance.now()-start,images:images.length}));
}

/** Runs inside the page: audit components, text lines and every clipping ancestor. */
export async function assertScreenFit(options: {document?:boolean;touchTargets?:boolean;prepare?:boolean;status?:string} = {}) {
  // As a polling predicate, defer the complete audit until the same exact
  // post-warm acknowledgement. Non-polling callers retain their original audit.
  if(options.status !== undefined && document.querySelector('[data-backend-status]')?.getAttribute('data-backend-status') !== options.status) return false;
  const timing={started:performance.now(),fonts:0,images:0,animations:0};
  if(options.prepare){
    await document.fonts.ready;timing.fonts=performance.now();
    await Promise.all([...document.images].filter(i=>i.checkVisibility({visibilityProperty:true})).map(i=>i.decode()));timing.images=performance.now();
    await Promise.all(document.getAnimations().filter(a=>a.playState!=='finished').map(a=>a.finished));timing.animations=performance.now();
    const transitions=(window as Window&{__beyondTransitions?:Map<Element,string>}).__beyondTransitions;
    if(!transitions||transitions.size)throw new Error('A Svelte transition is still active');
  }
  const modal = [...document.querySelectorAll<HTMLElement>('dialog:modal')].at(-1);
  // Native modality makes the document behind a popup inert. Audit its active
  // surface, including vertical viewport fit, even on a scrolling document page.
  const roots = options.document ? [modal ?? document.body] : [...document.querySelectorAll<HTMLElement>('[data-e2e-layout]')].filter(root => root.checkVisibility({visibilityProperty:true}) && (!modal || modal.contains(root)));
  if (!roots.length) throw new Error('No visible layout root to audit');
  const elements = [...new Set(roots.flatMap(root => [root, ...root.querySelectorAll<HTMLElement>('*')]))];
  // After readiness, this entire audit is synchronous and read-only. Bounds
  // and visibility cannot change during it; reuse the identical native results.
  const rectangles=new Map<Element,DOMRect>();
  const rectFor=(element:Element)=>{if(!rectangles.has(element))rectangles.set(element,element.getBoundingClientRect());return rectangles.get(element)!;};
  const visibility=new Map<Element,boolean>();
  const visibleFor=(element:Element)=>{if(!visibility.has(element))visibility.set(element,element.checkVisibility({visibilityProperty:true}));return visibility.get(element)!;};
  const styles = new Map<Element, CSSStyleDeclaration>();
  const style = (element: Element) => { if (!styles.has(element)) styles.set(element, getComputedStyle(element)); return styles.get(element)!; };
  // This audit is read-only. Cache immutable geometry within this one call,
  // preserving the original transform multiplication order and exact bounds.
  const matrices=new Map<HTMLElement,DOMMatrix>();
  const matrixFor=(element:HTMLElement)=>{
    if(!matrices.has(element)){
      let matrix=new DOMMatrix();
      for(let parent:HTMLElement|null=element;parent;parent=parent.parentElement){
        const transform=style(parent).transform;
        if(transform!=='none')matrix=new DOMMatrix(transform).multiply(matrix);
      }
      matrices.set(element,matrix);
    }
    return matrices.get(element)!;
  };
  const clips=new Map<HTMLElement,{left:number;top:number;right:number;bottom:number}>();
  const clipFor=(ancestor:HTMLElement)=>{
    if(!clips.has(ancestor)){
      const css=style(ancestor),box=rectFor(ancestor),matrix=matrixFor(ancestor);
      const sx=Math.hypot(matrix.a,matrix.b),sy=Math.hypot(matrix.c,matrix.d);
      const left=parseFloat(css.borderLeftWidth)||0,right=parseFloat(css.borderRightWidth)||0,top=parseFloat(css.borderTopWidth)||0,bottom=parseFloat(css.borderBottomWidth)||0;
      const scrollbarX=Math.max(0,ancestor.offsetWidth-ancestor.clientWidth-left-right),scrollbarY=Math.max(0,ancestor.offsetHeight-ancestor.clientHeight-top-bottom);
      clips.set(ancestor,{left:box.left+left*sx,top:box.top+top*sy,right:box.right-(right+scrollbarX)*sx,bottom:box.bottom-(bottom+scrollbarY)*sy});
    }
    return clips.get(ancestor)!;
  };
  const label = (element: Element) => `${element.tagName.toLowerCase()}.${element.className} (${element.getAttribute('aria-label') ?? element.textContent?.trim().slice(0,60) ?? ''})`;
  const viewport = {left:0, top:0, right:innerWidth, bottom:innerHeight};
  const outside = (rect:DOMRect, box:{left:number;top:number;right:number;bottom:number}, x=true,y=true) =>
    (x && (rect.left<box.left || rect.right>box.right)) || (y && (rect.top<box.top || rect.bottom>box.bottom));
  // Only explicitly named, keyboard-reachable vertical scroll regions permit
  // content to extend beyond their visible window. Hidden overflow still fails.
  const scrollRegion = (element: HTMLElement) => {
    for (let ancestor = element.parentElement; ancestor; ancestor = ancestor.parentElement) {
      if (ancestor.getAttribute('role') === 'region' && ancestor.tabIndex === 0 &&
          (ancestor.getAttribute('aria-label') || ancestor.getAttribute('aria-labelledby')) &&
          /^(auto|scroll)$/.test(style(ancestor).overflowY)) return ancestor;
    }
    return undefined;
  };
  const inspect = (element:HTMLElement, rect:DOMRect, text=false) => {
    if (!rect.width || !rect.height) return;
    const focused = document.activeElement === element || (!!document.activeElement?.matches('button,a,input,select,textarea') && document.activeElement.contains(element));
    const region = options.document && !focused ? scrollRegion(element) : undefined;
    const window = region?rectFor(region):undefined;
    const visible = window ? {left:rect.left,right:rect.right,top:Math.max(rect.top,window.top),bottom:Math.min(rect.bottom,window.bottom)} : rect;
    const verticalArea = visible.bottom > visible.top;
    if (outside(visible as DOMRect,viewport,true,verticalArea && (!options.document || !!modal))) throw new Error(`${text?'Text':'Component'} clipped by viewport: ${label(element)}`);
    for(let ancestor:HTMLElement|null=text?element:element.parentElement;ancestor;ancestor=ancestor.parentElement){
      const css=style(ancestor), x=/^(hidden|clip|auto|scroll)$/.test(css.overflowX), y=/^(hidden|clip|auto|scroll)$/.test(css.overflowY);
      if(!x&&!y)continue;
      const clip=clipFor(ancestor);
      const beyondRegion = region && (ancestor === region || ancestor.contains(region));
      const current = beyondRegion ? visible : rect;
      const inspectY = y && !(ancestor === region) && (!beyondRegion || verticalArea);
      if(outside(current as DOMRect,clip,x,inspectY))throw new Error(`${text?'Text':'Component'} clipped by ${label(ancestor)}: ${label(element)}`);
    }
  };
  if(document.documentElement.scrollWidth>innerWidth||(!options.document&&(document.documentElement.scrollHeight>innerHeight||scrollX||scrollY)))throw new Error('Game screen must fit without page scrolling');
  const controls:HTMLElement[]=[];
  for(const element of elements){
    if(element.closest('.sr-only,#svelte-announcer,[hidden],[aria-hidden="true"]')||!visibleFor(element)||element.matches('img[alt=""],.skip-link:not(:focus)'))continue;
    inspect(element,rectFor(element));
    if(element.dataset.layoutState==='overflow')throw new Error(`Card content overflow (${element.dataset.cardId}, width ${rectFor(element).width}): ${element.dataset.layoutIssues}`);
    for(const node of element.childNodes){
      if(node.nodeType!==Node.TEXT_NODE||!node.textContent?.trim())continue;
      const range=document.createRange();range.selectNodeContents(node);
      for(const rect of range.getClientRects())inspect(element,rect,true);
    }
    if(element.matches('button,input,select,a')&&!element.closest('[inert]')&&rectFor(element).width)controls.push(element);
  }
  // A pinned document navigation deliberately covers scrolled content. Compare
  // the remaining on-screen hit regions; game views still compare whole controls.
  const pinned=options.document?[...document.querySelectorAll<HTMLElement>('.sticky-nav')].filter(node=>visibleFor(node)&&/^(sticky|fixed)$/.test(style(node).position)).map(node=>rectFor(node)).filter(rect=>rect.top<=0&&rect.bottom>0):[];
  const hitRegion=(element:HTMLElement)=>{
    const rect=rectFor(element);
    if(!options.document)return rect;
    const top=Math.max(0,rect.top,...(element.closest('.sticky-nav')?[]:pinned.map(header=>header.bottom)));
    const scroll=scrollRegion(element),region=scroll?rectFor(scroll):undefined;
    return {left:Math.max(0,rect.left),right:Math.min(innerWidth,rect.right),top:Math.max(top,region?.top ?? 0),bottom:Math.min(innerHeight,rect.bottom,region?.bottom ?? innerHeight)};
  };
  type Point = {x:number;y:number};
  const rectangle=(r:{left:number;right:number;top:number;bottom:number}):Point[]=>[
    {x:r.left,y:r.top},{x:r.right,y:r.top},{x:r.right,y:r.bottom},{x:r.left,y:r.bottom}
  ];
  const hitPolygon=(element:HTMLElement):Point[]=>{
    // Preserve the document's clipped hit regions. Game controls use their
    // actual transformed border-box, rather than overlapping bounding boxes.
    if(options.document) {
      const region = hitRegion(element);
      return region.right > region.left && region.bottom > region.top ? rectangle(region) : [];
    }
    const rect=rectFor(element);
    let matrix=new DOMMatrix();
    for(let parent:HTMLElement|null=element;parent;parent=parent.parentElement){
      const css=style(parent);
      // Unknown/perspective geometry remains conservatively axis-aligned.
      if(css.perspective!=='none'||css.rotate!=='none'||css.scale!=='none'||!['1','normal'].includes(css.zoom))return rectangle(rect);
      if(css.transform!=='none')matrix=new DOMMatrix(css.transform).multiply(matrix);
    }
    if(!matrix.is2D)return rectangle(rect);
    const css=style(element);
    let width=parseFloat(css.width),height=parseFloat(css.height);
    if(!Number.isFinite(width)||!Number.isFinite(height))return rectangle(rect);
    if(css.boxSizing!=='border-box'){
      width+=parseFloat(css.paddingLeft)+parseFloat(css.paddingRight)+parseFloat(css.borderLeftWidth)+parseFloat(css.borderRightWidth);
      height+=parseFloat(css.paddingTop)+parseFloat(css.paddingBottom)+parseFloat(css.borderTopWidth)+parseFloat(css.borderBottomWidth);
    }
    const cx=(rect.left+rect.right)/2,cy=(rect.top+rect.bottom)/2;
    return [[-1,-1],[1,-1],[1,1],[-1,1]].map(([x,y])=>({
      x:cx+matrix.a*x*width/2+matrix.c*y*height/2,
      y:cy+matrix.b*x*width/2+matrix.d*y*height/2
    }));
  };
  const overlaps=(a:Point[],b:Point[])=>{
    if (!a.length || !b.length) return false;
    // Separating-axis theorem: no tolerance, masking or excluded controls.
    for(const polygon of [a,b])for(let i=0;i<polygon.length;i++){
      const p=polygon[i],q=polygon[(i+1)%polygon.length];
      const axis={x:p.y-q.y,y:q.x-p.x};
      const pa=a.map(v=>v.x*axis.x+v.y*axis.y),pb=b.map(v=>v.x*axis.x+v.y*axis.y);
      if(Math.max(...pa)<=Math.min(...pb)||Math.max(...pb)<=Math.min(...pa))return false;
    }
    return true;
  };
  if(options.touchTargets){
    // Keep the capture contract's original document-wide target audit, including
    // controls behind native modality; batching removes only a browser trip.
    for(const element of document.querySelectorAll<HTMLElement>('button,input,select')){
      if(!visibleFor(element))continue;
      const r=rectFor(element);
      if(r.width<44||r.height<44)throw new Error(`Touch target too small: ${element.textContent||element.getAttribute('aria-label')}`);
    }
  }
  const polygons=controls.map(hitPolygon);
  for(let i=0;i<controls.length;i++)for(let j=i+1;j<controls.length;j++){
    if(overlaps(polygons[i],polygons[j]))throw new Error(`Controls overlap: ${label(controls[i])} / ${label(controls[j])}`);
  }
  // Trace-only timings identify browser work separately from protocol stalls.
  // Every guard above and the caller's combined 2,000 ms deadline stay intact.
  console.info('beyond-capture-audit',JSON.stringify({fonts:timing.fonts?timing.fonts-timing.started:0,images:timing.images?timing.images-timing.fonts:0,animations:timing.animations?timing.animations-timing.images:0,audit:performance.now()-(timing.animations||timing.started),elements:elements.length,controls:controls.length}));
  return true;

}
