import type{PublicSetup}from'./setup';
/** The persisted queue serves several real phases; its internal storage name
 * must not tell a player a new discovery occurred when only an Action or an
 * already-discovered card's research bonus is pending. */
export function continuationKind(game:PublicSetup):'action'|'research'|'discovery'{
 const resume=game.discovery?.queue.find(q=>q.kind==='resume');
 if(resume?.kind==='resume'){
  if(resume.returnTo==='production'&&!resume.card&&game.players.find(p=>p.position===game.activePosition)?.actionLocation?.startsWith('technology:'))return'action';
  if(resume.card&&!resume.slot&&!resume.event)return'research';
 }
 return'discovery';
}
