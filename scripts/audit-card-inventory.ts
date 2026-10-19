import {writeFile} from 'node:fs/promises';
import {baseCards,inventoryCounts,originalArtGaps,physicalCardCount} from '../src/lib/cards/catalog';
import {auditCardInventory} from '../src/lib/cards/inventory-audit';
const problems=auditCardInventory(baseCards);
const report={edition:'English base game, second printing',designs:baseCards.length,physicalCopies:physicalCardCount,families:inventoryCounts,problems,originalArtGaps,cards:baseCards.map(c=>({id:c.id,title:c.title,family:c.family,copies:c.copies,level:c.technology?.level??c.event?.level,deck:c.deck,source:c.source.location,originalArt:c.art??'pending'}))};
if(process.argv[2])await writeFile(process.argv[2],JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({designs:report.designs,physicalCopies:report.physicalCopies,families:report.families,originalArtGaps:originalArtGaps.length,problems},null,2));
if(problems.length)process.exitCode=1;
