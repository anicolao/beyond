import {supplyCapacity} from './manifest';
import {discoveryMap} from './discovery-movement';
import type {PublicSetup,PlayerState} from './setup';
import type {TurnPlayer} from './turn';

/** Public inspection only. Commits still use the canonical turn reducer/rules. */
export function tradeSupply(player:TurnPlayer){
 const draw=player.supply.findIndex(count=>count>0);
 const space=player.supply.findLastIndex((count,index)=>count<supplyCapacity[index]);
 const returned=space<0?0:space;
 return {
  draw:draw<0?undefined:{index:draw,letter:String.fromCharCode(65+draw),before:player.supply[draw],after:player.supply[draw]-1},
  returned:{index:returned,letter:String.fromCharCode(65+returned),before:player.supply[returned],after:player.supply[returned]+1,overflow:space<0},
 };
}
export function tradePreview(game:PublicSetup,player:PlayerState){
 const locations=discoveryMap(game).locations;
 return {...tradeSupply(player),
  ships:player.ships.map((ship,index)=>{
   const powers=game.players.map(p=>({position:p.position,name:p.name,power:p.ships.filter(s=>s.location===ship.location&&s.id!==ship.id).reduce((n,s)=>n+s.level,0)}));
   const current=game.discovery?.outposts[ship.location];
   const max=Math.max(0,...powers.map(p=>p.power)),leaders=powers.filter(p=>p.power===max);
   // At zero power, control stays; an existing owner wins a tied lead.
   const owner=max===0?current?.owner:leaders.some(p=>p.position===current?.owner)?current!.owner:leaders.length===1?leaders[0].position:undefined;
   return {...ship,label:`${index===0?'Ship':index===1?'Second ship':`Ship ${index+1}`}`,locationTitle:locations.find(l=>l.id===ship.location)?.title??ship.location,
    powerBefore:powers.find(p=>p.position===player.position)!.power+ship.level,powerAfter:powers.find(p=>p.position===player.position)!.power,
    ...(current?{control:{before:game.players.find(p=>p.position===current.owner)?.name??'Unclaimed',after:game.players.find(p=>p.position===owner)?.name??'Unclaimed',changes:owner!==current.owner}}:{})};
  })
 };
}
