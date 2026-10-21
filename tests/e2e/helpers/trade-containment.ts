/** Browser-side guard for the rotated trade explanation. Axis-aligned viewport
 * rectangles cannot detect text hidden under a sibling footer at 45 degrees.
 * Both objects share the instrument's transform, so compare their actual layout
 * coordinates before that common rotation/scale, including ancestor scrolling. */
export function assertTradeContainment() {
  const modal=[...document.querySelectorAll<HTMLDialogElement>('dialog:modal')].at(-1);
  if(!modal?.matches('.turn-instrument.shared.angled[data-phase="trade"]'))return;
  const note=modal.querySelector<HTMLElement>('.trade-boundary');
  const footer=modal.querySelector<HTMLElement>('.instrument-frame > footer');
  if(!note||!footer)throw new Error('The trade explanation and footer must exist');
  const top=(element:HTMLElement)=>{
    let value=0;
    for(let node:HTMLElement|null=element;node;node=node.offsetParent as HTMLElement|null)value+=node.offsetTop;
    for(let node=element.parentElement;node;node=node.parentElement)value-=node.scrollTop;
    return value;
  };
  const bottom=top(note)+note.offsetHeight,limit=top(footer);
  if(note.scrollHeight>note.clientHeight||bottom>limit)throw new Error(`Trade explanation runs beneath the turn footer (${bottom} > ${limit})`);
}
