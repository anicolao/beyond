import {test,expect} from 'bun:test';
import {tradePreview} from '../../src/lib/game/trade-preview';
import {applyTurn,projectGame} from '../../src/lib/game/turn';
import {startingSetup} from '../../src/lib/game/setup';
import {defaultSettings} from '../../src/lib/remote/model';
const initial=()=>startingSetup({version:'basic-2020-v1',seed:'77777777-7777-4777-8777-777777777008'},[{position:'p1',name:'Ada',faction:'nishida'},{position:'p2',name:'Bora',faction:'zheng'}],defaultSettings);
test('ordinary Robotics trade repeatedly previews the exact canonical cube route without ordinary production',()=>{
 const game=initial();let play=applyTurn(game,undefined,'p1',{kind:'research-I',space:0,card:'advanced-robotics'});
 play=applyTurn(game,play,'p1',{kind:'trade'});const before=structuredClone(play);
 for(const kind of ['buy-population','sell-population','sell-population','buy-population','sell-population'] as const){
  const publicGame=projectGame(game,play),actor=publicGame.players[0],preview=tradePreview(publicGame,actor),old=structuredClone(actor);
  expect(projectGame(game,play)).toEqual(publicGame);
  play=applyTurn(game,play,'p1',{kind});const after=play.players.p1;
  if(kind==='buy-population'){expect(after.supply[preview.draw!.index]).toBe(preview.draw!.after);expect(after.ore).toBe(old.ore-3);expect(after.population).toBe(old.population+1);}
  else {expect(after.supply[preview.returned.index]).toBe(preview.returned.after);expect(after.ore).toBe(old.ore+1);expect(after.population).toBe(old.population-1);}
 }
 expect(before.players.p1.ore).toBe(4);expect(play.phase).toBe('trade');
 play=applyTurn(game,play,'p1',{kind:'finish-trading'});expect(play.phase).toBe('achievement');
 expect(()=>applyTurn(game,play,'p1',{kind:'ore'})).toThrow('exactly one');
});
test('labelled boundary economies preview rightmost returns, A overflow and exhausted recruitment exactly',()=>{
 const game=initial(),p=game.players[0];p.supply=[5,4,3,3,2];p.population=2;
 // Component boundary fixture only: no state injection in ordinary browser play.
 expect(tradePreview(game,p).returned).toMatchObject({letter:'A',overflow:true,before:5,after:6});
 p.supply=[0,0,1,3,1];expect(tradePreview(game,p).draw).toMatchObject({letter:'C',before:1,after:0});expect(tradePreview(game,p).returned).toMatchObject({letter:'E',overflow:false,before:1,after:2});
 p.supply=[0,0,0,0,0];expect(tradePreview(game,p).draw).toBeUndefined();
});
test('ship inspection names actual public systems and recomputes tied and zero-power control without changing history',()=>{
 const game=initial();
 // Public read-model boundary fixture; reducer/security control stories remain authoritative.
 const p=game.players[0],r=game.players[1];p.ships=[{id:'own-one',level:2,location:'shipyard-north'},{id:'own-two',level:1,location:'shipyard-north'}];r.ships=[{id:'rival',level:1,location:'shipyard-north'}];
 game.discovery={outposts:{'shipyard-north':{owner:'p1',track:'food'}},systems:[]} as unknown as NonNullable<typeof game.discovery>;
 const snapshot=structuredClone(game);let s=tradePreview(game,p).ships[0];
 expect(s.locationTitle).toBe('Northern shipyard');expect([s.powerBefore,s.powerAfter]).toEqual([3,1]);expect(s.control).toMatchObject({before:'Ada',after:'Ada',changes:false});
 r.ships[0].level=2;s=tradePreview(game,p).ships[0];expect(s.control).toMatchObject({after:'Bora',changes:true});
 r.ships=[];p.ships=[p.ships[0]];s=tradePreview(game,p).ships[0];expect(s.control?.after).toBe('Ada');
 expect(snapshot.discovery?.outposts).toEqual(game.discovery.outposts);
});

test('ordinary Gather plus trading can fill Supply and overflow A without any injected resource',()=>{
 const game=initial();let play=applyTurn(game,undefined,'p1',{kind:'gather'});play=applyTurn(game,play,'p1',{kind:'trade'});
 for(let i=0;i<3;i++)play=applyTurn(game,play,'p1',{kind:'sell-population'});
 expect(play.players.p1.supply).toEqual([7,4,3,3,2]);expect(play.players.p1.population).toBe(0);
 let visible=projectGame(game,play);expect(tradePreview(visible,visible.players[0]).returned).toMatchObject({letter:'A',overflow:true,after:8});
 play=applyTurn(game,play,'p1',{kind:'decommission',ship:'p1-ship-1'});play=applyTurn(game,play,'p1',{kind:'sell-population'});
 expect(play.players.p1.supply).toEqual([8,4,3,3,2]);expect(play.players.p1.ships).toHaveLength(0);
 for(let i=0;i<2;i++)play=applyTurn(game,play,'p1',{kind:'buy-population'});
 expect(play.players.p1.supply).toEqual([6,4,3,3,2]);expect(play.players.p1.population).toBe(2);expect(play.players.p1.ore).toBe(1);
 const after=applyTurn(game,play,'p1',{kind:'finish-trading'});expect(after.players.p1).toEqual(play.players.p1);
});

test('ordinary turns exhaust A and trade from Food-covered B while growth still cannot',()=>{
 const game=initial();let play:ReturnType<typeof applyTurn>|undefined;
 const move=(p:string,m:Parameters<typeof applyTurn>[3])=>play=applyTurn(game,play,p,m);
 const finish=(p:string)=>{move(p,{kind:'ore'});move(p,{kind:'end-turn'});};
 move('p1',{kind:'research-I',space:0,card:'advanced-robotics'});finish('p1');
 move('p2',{kind:'research-I',space:1,card:'advanced-robotics'});finish('p2');
 move('p1',{kind:'gather'});finish('p1');
 move('p2',{kind:'research-I',space:0,card:'advanced-genetics'});finish('p2');
 move('p1',{kind:'research-I',space:1,card:'advanced-genetics'});finish('p1');
 move('p2',{kind:'gather'});finish('p2');
 move('p1',{kind:'research-I',space:0,card:'narrow-beam-lasers',ship:'p1-ship-1'});finish('p1');
 move('p2',{kind:'research-I',space:1,card:'terraforming'});finish('p2');
 move('p1',{kind:'gather'});move('p1',{kind:'trade'});
 const before=projectGame(game,play);expect(before.players[0].foodDiscs).toBe(7);expect(before.players[0].supply[0]).toBe(2);
 for(let i=0;i<2;i++)move('p1',{kind:'buy-population'});
 const visible=projectGame(game,play),p=visible.players[0];expect(p.supply).toEqual([0,4,3,3,2]);
 expect(tradePreview(visible,p).draw).toMatchObject({letter:'B',before:4,after:3});
 move('p1',{kind:'buy-population'});expect(play!.players.p1.supply).toEqual([0,3,3,3,2]);expect(play!.players.p1.foodDiscs).toBe(7);
 expect(play!.players.p1.ore).toBe(6);expect(play!.phase).toBe('trade');
});
