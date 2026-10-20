import type {PlayState} from './turn';
import type {DiscoveryChoice} from './discovery';
import type {BonusEffect} from './discovery-effects';
export function prepend(state:PlayState,...steps:DiscoveryChoice[]){state.discovery!.queue.unshift(...steps);}
export function effects(state:PlayState,responder:string,source:string,bonus:readonly BonusEffect[]){prepend(state,...bonus.map(effect=>({kind:'effect' as const,responder,source,effect:structuredClone(effect)})));}
export function eventRecord(state:PlayState,id:string){return state.discovery!.events.find(e=>e.id===id)!;}
export function completeEvent(state:PlayState,event:string){eventRecord(state,event).resolved=true;}
