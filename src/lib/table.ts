export const positions = ['north', 'north-east', 'east', 'south-east', 'south', 'south-west', 'west', 'north-west'] as const;
export type Position = typeof positions[number];
export type Table = { seats: Partial<Record<Position, string>>; firstPlayer: Position | ''; revision: number };
export type Command = { type: 'table-created' | 'seat-joined' | 'seat-renamed' | 'seat-left' | 'first-player-chosen'; position: Position | ''; name: string };
export type TableEvent = Command & { schema: 1; actorUid: string; revision: number; commandId: string };
export function apply(table: Table | undefined, event: TableEvent): Table {
  if (event.schema !== 1 || event.revision !== (table ? table.revision + 1 : 0)) throw new Error('This table history is incompatible.');
  if (!table) {
    if (event.type !== 'table-created' || event.position || event.name) throw new Error('Invalid table creation.');
    return { seats: {}, firstPlayer: '', revision: 0 };
  }
  const { position, name, type } = event;
  if (!positions.includes(position as Position)) throw new Error('Choose a physical seat.');
  const p = position as Position, seats = { ...table.seats };
  let firstPlayer = table.firstPlayer;
  if (type === 'seat-joined' || type === 'seat-renamed') {
    if (!name.trim() || name !== name.trim() || name.length > 24) throw new Error('Enter a name of 1–24 characters.');
    if (type === 'seat-joined' && (seats[p] || Object.keys(seats).length >= 4)) throw new Error('This seat is unavailable.');
    if (type === 'seat-renamed' && !seats[p]) throw new Error('This seat is empty.');
    seats[p] = name;
    firstPlayer ||= p;
  } else if (type === 'seat-left') {
    if (!seats[p] || name) throw new Error('This seat is empty.');
    delete seats[p];
    if (firstPlayer === p) firstPlayer = positions.find(candidate => seats[candidate]) ?? '';
  } else if (type === 'first-player-chosen') {
    if (!seats[p] || name) throw new Error('Choose an occupied seat.');
    firstPlayer = p;
  } else throw new Error('Unsupported table command.');
  return { seats, firstPlayer, revision: event.revision };
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
