import {canonicalCard} from '../cards/catalog';
import type {PublicSetup} from './setup';
import type {PlayState} from './turn';
import {explorationBoard} from './manifest';
export type AchievementClaim={card:string;position:string;turn:number;reward:number};
export function meetsAchievement(game:PublicSetup,position:string,id:string){
 const p=game.players.find(p=>p.position===position)!;
 const level=(n:string)=>game.technologies.filter(t=>canonicalCard(t.card).technology?.level===n&&p.research.includes(t.card));
 switch(id){
  case 'transcendence':return level('IIII').length>0;
  case 'empire':case 'prosperity':return false; // No colonization command exists in this increment.
  case 'technologist':return level('II').length===6;
  case 'efficiency':return p.foodDiscs===0||p.oreDiscs===0;
  case 'agility':return [...level('II'),...level('III')].reduce((n,t)=>n+canonicalCard(t.card).sections.reduce((m,s)=>m+(s.spaces??0),0),0)>=7;
  case 'posthumanist':return p.supply.reduce((a,b)=>a+b,0)<=2;
  case 'strategist':return p.ore>=8&&p.population>=4&&p.ships.length>=4;
  case 'warlord':return [...new Set(p.ships.map(s=>s.location))].filter(location=>p.ships.filter(s=>s.location===location).reduce((n,s)=>n+s.level,0)>=4).length>=3;
  case 'specialization':{
   const controls=Object.entries(game.discovery?.outposts??{}).filter(([,o])=>o.owner===position).map(([location])=>{
    const printed=explorationBoard(game.count).locations.find(l=>l.id===location);if(printed?.specialty)return printed.specialty;
    const system=game.systems.find(s=>s.slot===location);const section=system&&canonicalCard(system.card).sections.find(s=>s.label==='Specialty');return section?.secondarySymbol?'either':section?.symbol;
   });return ['food','ore'].some(track=>controls.filter(kind=>kind===track||kind==='either').length>=6);
  }
  default:return false;
 }
}
export function availableClaims(game:PublicSetup){
 const claims=game.discovery?.claims??[];
 if(game.phase!=='achievement'||claims.some(c=>c.position===game.activePosition&&c.turn===game.turn))return [];
 return game.achievements.filter(id=>{
  const card=canonicalCard(id),taken=claims.filter(c=>c.card===id);
  return !taken.some(c=>c.position===game.activePosition)&&taken.length<(card.deck==='A'&&game.count<4?1:card.rewards!.length)&&meetsAchievement(game,game.activePosition,id);
 });
}
export function claimAchievement(game:PublicSetup,state:PlayState,position:string,id:string){
 if(position!==game.activePosition||!state.discovery||!availableClaims(game).includes(id))throw new Error('Choose one of your eligible, available achievements.');
 state.discovery.claims??=[];
 const card=canonicalCard(id),taken=state.discovery.claims.filter(c=>c.card===id).length;
 state.discovery.claims.push({card:id,position,turn:state.turn,reward:card.rewards![taken]});return state;
}
