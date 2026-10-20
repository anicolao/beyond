import {foodColumns,oreYields} from './manifest';
import type {TurnPlayer} from './turn';

/** Public, read-only production. A covered letter never borrows another column. */
export function productionPreview(player:TurnPlayer) {
  const foodExposed=9-player.foodDiscs,oreExposed=9-player.oreDiscs;
  const columns=player.supply.map((supply,index)=>{
    const letter=String.fromCharCode(65+index);
    const exposed=foodColumns.slice(0,foodExposed).some(candidate=>candidate===letter);
    return {letter,supply,exposed,yield:exposed&&supply>0?1:0};
  });
  return {
    columns,
    food:foodColumns.map((letter,index)=>({letter,exposed:index<foodExposed})),
    ore:oreYields.map((yieldValue,index)=>({yield:yieldValue,exposed:index<oreExposed})),
    population:columns.reduce((total,column)=>total+column.yield,0),
    oreYield:oreYields.slice(0,oreExposed).reduce((total,value)=>total+value,0),
    cubes:{supply:player.supply.reduce((total,count)=>total+count,0),population:player.population,ships:player.ships.length,research:player.research.length+(player.reservedResearch?.length??0)}
  };
}
