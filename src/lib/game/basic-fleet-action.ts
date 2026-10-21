import {basicActions} from './manifest';
import {player,validEconomies} from './discovery-economy';
import {permittedActionShipyards} from './technology-actions';
import type {PlayState} from './turn';
import type {PublicSetup} from './setup';
export type BasicFleetMove={kind:'build-jump';space:number;build:boolean;destination:string};
export function basicFleetCost(game:PublicSetup,space:number){return basicActions.find(a=>a.id==='build-jump')!.spaces[game.count][space];}
export function basicFleetBlocker(game:PublicSetup,space:number,build:boolean,destination:string){
 const actor=game.players.find(p=>p.position===game.activePosition)!;
 if(game.phase!=='action')return 'Finish the current phase first.';
 const cost=basicFleetCost(game,space);
 if(!Number.isInteger(space)||cost===undefined)return 'Choose a printed build-and-jump Action space.';
 const occupant=game.players.find(p=>p.actionLocation===`build-jump:${space}`);
 if(occupant)return occupant.position===actor.position?'Move to a different Action space.':`Occupied by ${occupant.name}.`;
 if(actor.ore<cost)return `Need ${cost} Ore for this Action space.`;
 if(build&&actor.population<1)return 'Need 1 available Population to build this ship.';
 if(!permittedActionShipyards(game).includes(destination))return 'Choose Sol or your controlled shipyard.';
 return '';
}
export function beginBasicFleet(initial:PublicSetup,game:PublicSetup,state:PlayState,position:string,move:BasicFleetMove){
 if(position!==game.activePosition)throw new Error('Only the active faction may move its Action pawn.');
 if(typeof move.build!=='boolean')throw new Error('Choose whether to build the optional ship.');
 const reason=basicFleetBlocker(game,move.space,move.build,move.destination);if(reason)throw new Error(reason);
 if(!state.discovery||!game.discovery?.powerReady||state.discovery.queue.length)throw new Error('The public board is still preparing.');
 const p=player(initial,state,position);p.ore-=basicFleetCost(game,move.space);p.actionLocation=`build-jump:${move.space}`;
 const source='basic-spacefaring';
 state.discovery.queue=[...(move.build?[{kind:'effect' as const,responder:position,source,effect:{kind:'ship' as const,level:1 as const,cube:'population' as const,location:move.destination}}]:[]),{kind:'effect',responder:position,source,effect:{kind:'jump',amount:2}},{kind:'resume',responder:position,returnTo:'production'}];
 state.phase='discovery';validEconomies(initial,state);return state;
}
