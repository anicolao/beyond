import {test,expect} from 'bun:test';
import {productionPreview} from '../../src/lib/game/production-preview';
import {applyTurn,economy,projectGame} from '../../src/lib/game/turn';
import {startingSetup} from '../../src/lib/game/setup';
import {defaultSettings} from '../../src/lib/remote/model';
const initial=()=>startingSetup({version:'basic-2020-v1',seed:'77777777-7777-4777-8777-777777777007'},[{position:'p1',name:'Ada',faction:'nishida'},{position:'p2',name:'Bora',faction:'zheng'}],defaultSettings);
test('a real Genetics turn exposes a blank, preserves A-only growth and conserves the cube cycle',()=>{
 const game=initial(),research=applyTurn(game,undefined,'p1',{kind:'research-I',space:0,card:'advanced-genetics'}),before=projectGame(game,research).players[0],preview=productionPreview(before);
 expect(preview.food.filter(slot=>slot.exposed).map(slot=>slot.letter)).toEqual(['A',null]);
 expect(preview.columns.filter(column=>column.exposed).map(column=>column.letter)).toEqual(['A']);
 expect(preview.population).toBe(1);expect(preview.oreYield).toBe(1);expect(Object.values(preview.cubes).reduce((a,b)=>a+b,0)).toBe(20);
 const growth=applyTurn(game,research,'p1',{kind:'grow'}).players.p1;
 expect(growth.population-before.population).toBe(preview.population);expect(growth.supply).toEqual([3,4,3,3,2]);expect(growth.ore).toBe(before.ore);
 expect(Object.values(productionPreview(growth).cubes).reduce((a,b)=>a+b,0)).toBe(20);
});
test('empty exposed A cannot borrow B; revealing B enables exactly its own cube',()=>{
 // Labelled read-model fixture: no injected state is used by ordinary UI stories.
 const player=economy(initial().players[0]);player.supply=[0,4,3,3,2];player.population+=5;
 expect(productionPreview(player).population).toBe(0);
 player.foodDiscs=6;
 const preview=productionPreview(player);
 expect(preview.population).toBe(1);expect(preview.columns.map(column=>column.yield)).toEqual([0,1,0,0,0]);
 expect(preview.columns[0]).toMatchObject({exposed:true,supply:0});expect(preview.columns[2]).toMatchObject({exposed:false,supply:3});
});
test('a real Robotics turn previews the complete changed Ore yield without consuming cubes',()=>{
 const game=initial(),research=applyTurn(game,undefined,'p1',{kind:'research-I',space:0,card:'advanced-robotics'}),before=projectGame(game,research).players[0],preview=productionPreview(before);
 expect(preview.oreYield).toBe(2);expect(preview.ore.filter(slot=>slot.exposed)).toHaveLength(2);
 const after=applyTurn(game,research,'p1',{kind:'ore'}).players.p1;
 expect(after.ore-before.ore).toBe(2);expect(productionPreview(after).cubes).toEqual(preview.cubes);expect(after.supply).toEqual(before.supply);
});
