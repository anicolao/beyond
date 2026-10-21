import {automationScore} from './automation-scoring';
import {productionPreview} from './production-preview';
import type {TurnPlayer} from './turn';

/** Read-only next-effect projection. Automation is not a control outpost. */
export function automationPreview(player:TurnPlayer,track:'food'|'ore') {
  const field=track==='food'?'foodDiscs':'oreDiscs';
  const before=productionPreview(player);
  const after=productionPreview({...player,[field]:Math.max(0,player[field]-1)});
  return {
    level:player.automation,nextLevel:player.automation+1,
    pointsBefore:automationScore(player.automation),pointsAfter:automationScore(player.automation+1),
    marker:player[field]?'production-disc' as const:'placeholder' as const,
    track,remainingDiscs:Math.max(0,player[field]-1),
    populationBefore:before.population,populationAfter:after.population,
    oreBefore:before.oreYield,oreAfter:after.oreYield,
    newlyExposed:track==='food'?after.food.flatMap((slot,i)=>slot.exposed&&!before.food[i].exposed?[{position:i,letter:slot.letter}]:[]):[],
    beyondPrintedTrack:Math.max(0,player.automation-7),
    // Extra levels score even when no further production disc can be removed.
    additionalOverflowPoint:player.automation>=7?1:0
  };
}
