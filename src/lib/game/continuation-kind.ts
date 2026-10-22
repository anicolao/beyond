import type{PublicSetup}from'./setup';
/** The persisted queue serves several real phases; its internal storage name
 * must not tell a player a new discovery occurred when only an Action or an
 * already-discovered card's research bonus is pending. */
export function continuationKind(game:PublicSetup):'action'|'research'|'control'|'colony'|'discovery'{
 const colonySource=/^(technology:(terraforming:1|android-surveyors:0|terranova-cruisers:0):|guild:terraforming-guild:)/.test(game.players.find(p=>p.position===game.activePosition)?.actionLocation??'');
 if(game.discovery?.queue.some(q=>q.kind==='colony')||colonySource&&game.discovery?.colonies?.some(c=>c.owner===game.activePosition&&c.turn===game.turn))return 'colony';
 const resume=game.discovery?.queue.find(q=>q.kind==='resume');
 if(resume?.kind==='resume'){
  if(resume.returnTo==='trade'&&!resume.card&&!resume.slot&&!resume.event)return'control';
  if(resume.returnTo==='production'&&!resume.card&&/^(technology:|build-jump:)/.test(game.players.find(p=>p.position===game.activePosition)?.actionLocation??''))return'action';
  if(resume.card&&!resume.slot&&!resume.event)return'research';
 }
 return'discovery';
}
