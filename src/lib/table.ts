import { legalFaction, setupVersion, type FactionId } from './game/manifest';
import { applyTurn, type PlayState, type TurnMove } from './game/turn';
import { startingSetup, validSeed, validatePlayers, type SetupSettings, type BasicStart } from './game/setup';
export const positions = ['north', 'north-east', 'east', 'south-east', 'south', 'south-west', 'west', 'north-west'] as const;
export type Position = typeof positions[number];
export type Table = { seats: Partial<Record<Position, string>>; firstPlayer: Position | ''; revision: number; settings?: SetupSettings; factions?: Partial<Record<Position,FactionId>>; start?: BasicStart; play?: PlayState };
export type Command = { type: 'game-move' | 'table-created' | 'seat-joined' | 'seat-renamed' | 'seat-left' | 'first-player-chosen' | 'table-settings-changed' | 'table-faction-selected' | 'game-begun'; settings?: SetupSettings; faction?: FactionId; start?: BasicStart; move?:TurnMove; position: Position | ''; name: string };
export type TableEvent = Command & { schema: 1; actorUid: string; revision: number; commandId: string };
export function apply(table: Table | undefined, event: TableEvent): Table {
  if (event.schema !== 1 || event.revision !== (table ? table.revision + 1 : 0)) throw new Error('This table history is incompatible.');
  if (!table) {
    if (event.type !== 'table-created' || event.position || event.name) throw new Error('Invalid table creation.');
    return { seats: {}, firstPlayer: '', revision: 0 };
  }
  if(event.type==='game-move') {
    if(!table.start||!event.move||event.name||event.settings||event.faction||event.start)throw new Error('Choose a legal move in a begun game.');
    const initial=startingSetup(table.start,clockwise(table).map(p=>({position:p,name:table.seats[p]!,faction:table.factions![p]!})),table.settings??{factions:'basic',achievements:'introductory'});
    return {...table,play:applyTurn(initial,table.play,event.position,event.move,table.start.seed),revision:event.revision};
  }
  if(event.move)throw new Error('Unsupported turn payload.');
  if(table.start) throw new Error('This game has begun. Its setup is permanent.');
  const { position, name, type } = event;
  if(type === 'game-begun') {
    if(position || name || !event.start || event.start.version !== setupVersion || !validSeed(event.start.seed) || event.faction || event.settings) throw new Error('Invalid Begin command.');
    validatePlayers(clockwise(table).map(p=>({position:p,name:table.seats[p]!,faction:table.factions?.[p]!})),table.settings ?? {factions:'basic',achievements:'introductory'});
    return {...table,start:{...event.start},revision:event.revision};
  }
  if(type === 'table-settings-changed') {
    if(position || name || !event.settings || !['basic','advanced'].includes(event.settings.factions) || !['introductory','randomized'].includes(event.settings.achievements) || event.start || event.faction || JSON.stringify(event.settings) === JSON.stringify(table.settings ?? {factions:'basic',achievements:'introductory'})) throw new Error('Choose different valid table settings.');
    return {...table,settings:{...event.settings},factions:event.settings.factions==='basic'?{...table.factions}:{},revision:event.revision};
  }
  if(event.start || event.settings || (event.faction && type !== 'table-faction-selected')) throw new Error('Unsupported setup payload.');
  if (!positions.includes(position as Position)) throw new Error('Choose a physical seat.');
  const p = position as Position, seats = { ...table.seats };
  let firstPlayer = table.firstPlayer;
  const choices={...table.factions};
  if(type === 'table-faction-selected') {
    if(!seats[p] || name || !event.faction || (table.settings?.factions ?? 'basic') !== 'basic' || !legalFaction(event.faction,Object.keys(seats).length as 2|3|4) || choices[p]===event.faction || Object.entries(choices).some(([position,f])=>position!==p && f===event.faction)) throw new Error('Choose an available legal Basic faction.');
    choices[p]=event.faction;
  } else if (type === 'seat-joined' || type === 'seat-renamed') {
    if (!name.trim() || name !== name.trim() || name.length > 24) throw new Error('Enter a name of 1–24 characters.');
    if (type === 'seat-joined' && (seats[p] || Object.keys(seats).length >= 4)) throw new Error('This seat is unavailable.');
    if (type === 'seat-renamed' && !seats[p]) throw new Error('This seat is empty.');
    seats[p] = name;
    firstPlayer ||= p;
  } else if (type === 'seat-left') {
    if (!seats[p] || name) throw new Error('This seat is empty.');
    delete seats[p]; delete choices[p];
    if(Object.keys(seats).length===2) for(const position of positions) if(choices[position]==='disciples') delete choices[position];
    if (firstPlayer === p) firstPlayer = positions.find(candidate => seats[candidate]) ?? '';
  } else if (type === 'first-player-chosen') {
    if (!seats[p] || name) throw new Error('Choose an occupied seat.');
    firstPlayer = p;
  } else throw new Error('Unsupported table command.');
  if(Object.keys(seats).length===2) for(const position of positions) if(choices[position]==='disciples') delete choices[position];
  return { ...table, ...(table.factions || Object.keys(choices).length ? {factions:choices}:{}), seats, firstPlayer, revision: event.revision };
}
export function projectTable(events: TableEvent[]): Table {
  let table: Table | undefined;
  for (const event of events) table = apply(table, event);
  if (!table) throw new Error('This table could not be found.');
  return table;
}
export function clockwise(table: Table): Position[] {
  const start = positions.indexOf(table.firstPlayer as Position);
  return [...positions.slice(start), ...positions.slice(0, start)].filter(p => table.seats[p]);
}
