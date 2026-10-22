import type {Colony,ColonyStep} from './colonization';
import type {AchievementClaim} from './achievements';
import type {BonusEffect} from './discovery-effects';
import {canonicalCard} from '../cards/catalog';
import type {TechnologyType} from '../cards/types';
import {basicActions,technologySlots,type PlayerCount} from './manifest';
import {setupDecks,type PublicSetup} from './setup';

export type DiscoveryRecord={slot:string;event:string;type?:TechnologyType;revealed?:string[];candidates?:string[];chosen?:string};
export type ResearchReservation={position:string;slot:string};
export type RevealedEvent={id:string;slot:string;resolved:boolean;target?:string;choice?:string;rolls?:{position:string;face:number;attempts:number}[]};
export type DiscoveryChoice=
 | ColonyStep
 | {kind:'event';event:string;responder:string;slot:string;stage?:string;value?:string;face?:number;rolls?:number}
 | {kind:'type';responder:string;slot:string;types:TechnologyType[]}
 | {kind:'candidate';responder:string;slot:string;cards:string[];revealed:string[];type:TechnologyType}
 | {kind:'guild';responder:string;event:string;slot:string}
 | {kind:'effect';responder:string;source:string;effect:BonusEffect}
 | {kind:'jump-apply';responder:string;amount:number;legs:import('./discovery-movement').JumpLeg[]}
 | {kind:'jump-power';responder:string;amount:number;legs:import('./discovery-movement').JumpLeg[];index:number}
 | {kind:'control';responder:string;location:string;source:string}
 | {kind:'control-check';responder:string;location:string;source:string}
 | {kind:'control-loss';responder:string;location:string;source:string}
 | {kind:'gain-bonus';responder:string;location:string;source:string}
 | {kind:'event-complete';responder:string;event:string}
 | {kind:'resume';responder:string;card?:string;slot?:string;event?:string;returnTo?:'production'|'trade'};
/** Internal canonical state. Deck order is deliberately absent from PublicDiscovery. */
export type DiscoveryState={colonies?:Colony[];jumpControlChecks?:DiscoveryChoice[];deckII:string[];records:DiscoveryRecord[];technologies:{slot:string;card:string}[];events:RevealedEvent[];guilds:string[];queue:DiscoveryChoice[];reservations:ResearchReservation[];revealBoundary?:{turn:number;reason:'Event reveal'|'Technology reveal'|'System reveal'};seed:string;achievements:string[];claims:AchievementClaim[];basis:string[];eventDeck:string[];cursor:number;sequence:number;rollIndex:number;systems:{slot:string;card:string;parent:string}[];systemDecks:{A:string[];B:string[]};systemBasis:Record<string,string>;outposts:Record<string,{owner:string;track:'food'|'ore';placeholder?:boolean}>;industry:string[];powers:Record<string,Record<string,number>>;completed?:{turn:number;card:string}};
export type PublicDiscovery=Omit<DiscoveryState,'deckII'|'seed'|'systemDecks'|'basis'|'eventDeck'|'achievements'|'rollIndex'|'systemBasis'|'powers'|'jumpControlChecks'>&{powerReady?:boolean;powerPositions?:string[]};
export function publicDiscovery(state:DiscoveryState,count?:number):PublicDiscovery{
 return JSON.parse(JSON.stringify({...((state.colonies?.length)?{colonies:state.colonies}:{}),powerReady:count!==undefined&&Object.values(state.powers??{}).filter(power=>'*' in power).length===count,powerPositions:Object.entries(state.powers??{}).filter(([,power])=>'*' in power).map(([position])=>position),records:state.records,technologies:state.technologies,events:state.events,guilds:state.guilds,queue:state.queue,reservations:state.reservations,...(state.revealBoundary?{revealBoundary:state.revealBoundary}:{}),claims:state.claims??[],cursor:state.cursor,sequence:state.sequence,systems:state.systems,outposts:state.outposts,industry:state.industry,...(state.completed?{completed:state.completed}:{})}));
}
export function initialDiscovery(seed:string,count:PlayerCount,turn:number,achievements:readonly string[]=['transcendence','empire','technologist','warlord']):DiscoveryState{
 const decks=setupDecks(seed,count);const systemBasis=Object.fromEntries([...decks.startingA.map((card,i)=>[`a-${i+1}`,card]),...decks.systemsB.slice(0,2).map((card,i)=>[`b-${i+1}`,card])]);return {seed,achievements:[...achievements],claims:[],basis:decks.technologies.I,eventDeck:decks.events.II,cursor:0,sequence:0,rollIndex:0,systems:[],systemDecks:{A:decks.systemsA,B:decks.systemsB.slice(2)},systemBasis,outposts:{},industry:[],powers:{},deckII:decks.technologies.II,records:[],technologies:[],events:[],guilds:[],queue:[],reservations:[]};
}
export function visibleTechnologies(game:PublicSetup,state?:PublicDiscovery){return [...game.technologies,...(state?.technologies??[])];}
export function permittedTypes(game:PublicSetup,slotId:string,state?:PublicDiscovery):TechnologyType[]{
 const slot=technologySlots.find(s=>s.id===slotId);if(!slot||slot.level!=='II')throw new Error('Choose a printed Level II slot.');
 return [...new Set(slot.prerequisites.flatMap(id=>{const known=visibleTechnologies(game,state).find(t=>t.slot===id);return known?[...canonicalCard(known.card).technology!.outgoing]:[];}))];
}
export function levelTwoBlocker(game:PublicSetup,space:number,slotId:string,state?:PublicDiscovery):string{
 if(game.phase!=='action')return 'Finish the current mandatory choice first.';
 const actor=game.players.find(p=>p.position===game.activePosition)!;
 const printed=basicActions.find(a=>a.id==='research-II')!.spaces[game.count];
 if(!Number.isInteger(space)||space<0||space>=printed.length)return 'Choose a printed Level II action space.';
 const occupant=game.players.find(p=>p.actionLocation===`research-II:${space}`);
 if(occupant)return occupant.position===actor.position?'Move to another action space.':`Occupied by ${occupant.name}.`;
 const slot=technologySlots.find(s=>s.id===slotId);
 if(!slot||slot.level!=='II')return 'Choose a printed Level II slot.';
 const known=visibleTechnologies(game,state);const existing=known.find(t=>t.slot===slotId);
 if(existing&&actor.research.includes(existing.card))return 'Already researched by your faction.';
 const missing=slot.prerequisites.filter(id=>{const card=known.find(t=>t.slot===id);return !card||!actor.research.includes(card.card);});
 if(missing.length)return `Research ${missing.map(id=>{const c=known.find(t=>t.slot===id);return c?canonicalCard(c.card).title:id;}).join(' and ')} first.`;
 if(actor.population<1)return 'Need 1 available Population for permanent research.';
 const cost=levelTwoCost(game.count,space,slotId,state);
 if(actor.ore<cost)return `Need ${cost} Ore (${cost-actor.ore} more).`;
 return '';
}
export function levelTwoCost(count:PlayerCount,space:number,slotId:string,state?:PublicDiscovery){
 const printed=basicActions.find(a=>a.id==='research-II')!.spaces[count];
 return 2+(printed[space]??0)+(state?.events.some(e=>e.id==='research-tariffs'&&e.target===slotId)?1:0);
}
/** Cards are revealed in order until two incoming triangles match. No deck shuffle. */
export function revealTwo(deck:readonly string[],type:TechnologyType){
 const candidates:string[]=[],revealed:string[]=[];let index=0;
 while(index<deck.length&&candidates.length<2){const id=deck[index++];revealed.push(id);if(canonicalCard(id).technology?.incoming.includes(type))candidates.push(id);}
 if(candidates.length!==2)throw new Error('The Level II deck cannot supply two matching candidates.');
 return {candidates,revealed,remaining:deck.slice(index)};
}
/** Named stream changes only the rejected/bypassed bottom packet. */
export function shuffledBottom(cards:readonly string[],seed:string,label:string){
 const result=[...cards];let state=2166136261;
 for(const c of `${seed}/discovery-bottom/${label}`)state=Math.imul(state^c.charCodeAt(0),16777619)>>>0;
 state||=1;
 const next=()=>{state^=state<<13;state^=state>>>17;state^=state<<5;return state>>>0;};
 for(let i=result.length-1;i>0;i--){const limit=Math.floor(0x100000000/(i+1))*(i+1);let draw=next();while(draw>=limit)draw=next();const j=draw%(i+1);[result[i],result[j]]=[result[j],result[i]];}
 return result;
}
export function chooseFromRevealed(state:DiscoveryState,choice:Extract<DiscoveryChoice,{kind:'candidate'}>,card:string){
 if(!choice.cards.includes(card))throw new Error('Choose one of the two public candidates.');
 const index=state.records.findIndex(r=>r.slot===choice.slot);if(index<0)throw new Error('Missing committed research.');
 if(state.records[index].chosen||state.technologies.some(t=>t.slot===choice.slot))throw new Error('This discovery is already committed.');
 state.technologies.push({slot:choice.slot,card});state.records[index].chosen=card;
 state.deckII.push(...shuffledBottom(choice.revealed.filter(id=>id!==card),state.seed,`${index}/${choice.slot}`));
 return card;
}
