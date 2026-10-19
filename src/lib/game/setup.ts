import { achievementDecks, events, factions, legalFaction, levelOne, setupVersion, startingSystems, supplyCapacity, systemDecks, technologyDecks, type FactionId, type PlayerCount } from './manifest';
export type SetupSettings = { factions:'basic'|'advanced'; achievements:'introductory'|'randomized' };
export type SetupPlayer = { position:string; name:string; faction:FactionId };
export type BasicStart = { version:typeof setupVersion; seed:string };
export type PlayerState = SetupPlayer & { ore:number; population:number; supply:number[]; foodDiscs:number; oreDiscs:number; automation:number; ships:{id:string;level:1|2|3|4;location:string}[]; actionLocation:string|null; research:string[] };
export type PublicSetup = { version:typeof setupVersion; activePosition:string; phase:'action'|'production'|'trade'|'achievement'; achievementClaims:0; count:PlayerCount; overlay:PlayerCount; endgameClaims:3|4; achievementSecondSlot:boolean; players:PlayerState[]; technologies:{slot:string;card:string}[]; systems:{slot:string;card:string}[]; achievements:string[]; deckCounts:Record<string,number>; eventCovers:{slot:string;level:'II'|'III'}[] };
export function validSeed(seed: string) { return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(seed); }
// Independent named streams: adding another deck never shifts existing shuffles.
function stream(seed:string,label:string) {
  let state=2166136261;
  for(const c of `${setupVersion}/${seed}/${label}`) state=Math.imul(state^c.charCodeAt(0),16777619)>>>0;
  state ||= 1;
  return () => { state ^= state<<13; state ^= state>>>17; state ^= state<<5; return state>>>0; };
}
function shuffled<T>(cards:readonly T[], seed:string,label:string):T[] {
  const result=[...cards], next=stream(seed,label);
  for(let i=result.length-1;i>0;i--) {
    const limit=Math.floor(0x100000000/(i+1))*(i+1); let draw=next();
    while(draw>=limit) draw=next();
    const j=draw%(i+1); [result[i],result[j]]=[result[j],result[i]];
  }
  return result;
}
/** Internal deterministic draw order. Never pass this object to a renderer. */
export function setupDecks(seed:string,count:PlayerCount) {
  if(!validSeed(seed)) throw new Error('Invalid setup random input.');
  const starts=shuffled(startingSystems,seed,'starting-systems').slice(0,count===2?1:2);
  const a=shuffled(systemDecks.A.filter(id=>!starts.includes(id as typeof starts[number])),seed,'systems-A');
  const b=shuffled(systemDecks.B,seed,'systems-B');
  const eventOrder=(level:'II'|'III')=>shuffled([...events[level].fixed,...shuffled(events[level].random,seed,`events-${level}-select`).slice(0,4)],seed,`events-${level}-place`);
  return { startingA:starts, systemsA:a, systemsB:b, technologies:{ I:shuffled(levelOne,seed,'tech-I'), II:shuffled(technologyDecks.II,seed,'tech-II'), III:shuffled(technologyDecks.III,seed,'tech-III'), IIII:shuffled(technologyDecks.IIII,seed,'tech-IIII') }, events:{II:eventOrder('II'),III:eventOrder('III')} };
}
export function validatePlayers(players:readonly SetupPlayer[],settings:SetupSettings) {
  const count=players.length as PlayerCount;
  if(settings.factions!=='basic') throw new Error('Advanced faction setup arrives in its dedicated increment. Choose Basic to begin.');
  if(![2,3,4].includes(count) || new Set(players.map(p=>p.position)).size!==count || new Set(players.map(p=>p.faction)).size!==count || players.some(p=>!legalFaction(p.faction,count))) throw new Error('Choose a different legal Basic faction for every player.');
}
export function startingSetup(start:BasicStart, players:readonly SetupPlayer[],settings:SetupSettings):PublicSetup {
  if(start.version!==setupVersion) throw new Error('This setup needs a newer client.');
  validatePlayers(players,settings);
  const count=players.length as PlayerCount, decks=setupDecks(start.seed,count);
  return {
    version:setupVersion,activePosition:players[0].position,phase:'action',achievementClaims:0,count,overlay:count,endgameClaims:count===4?4:3,achievementSecondSlot:count===4,
    players:players.map((p,i)=>{
      const f=factions.find(f=>f.id===p.faction)!; const supply:number[]=[...supplyCapacity];
      if(f.column>=0) supply[f.column]--;
      return {...p,ore:(i<2?1:2)+f.ore,population:f.extra==='population'?3:2,supply,foodDiscs:8,oreDiscs:8,automation:0,ships:[{id:`${p.position}-ship-1`,level:1,location:f.shipLocation},...(f.extra==='ship'?[{id:`${p.position}-ship-2`,level:1 as const,location:'sol'}]:[])],actionLocation:null,research:[]};
    }),
    technologies:decks.technologies.I.map((card,i)=>({slot:`I-${i+1}`,card})),
    eventCovers:(['II','III'] as const).flatMap(level=>Array.from({length:6},(_,i)=>({slot:`${level}-${i+1}`,level}))),
    systems:[...decks.startingA.map((card,i)=>({slot:`a-${i+1}`,card})),...decks.systemsB.slice(0,2).map((card,i)=>({slot:`b-${i+1}`,card}))],
    achievements:['transcendence','empire',settings.achievements==='introductory'?'technologist':shuffled(achievementDecks.A,start.seed,'achievement-A')[0],settings.achievements==='introductory'?'warlord':shuffled(achievementDecks.B,start.seed,'achievement-B')[0]],
    deckCounts:{II:16,III:16,IIII:10,A:12-decks.startingA.length,B:10}
  };
}
