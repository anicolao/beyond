import { legalFaction, setupVersion, type FactionId } from '../game/manifest';
import { applyTurn, type PlayState, type TurnMove } from '../game/turn';
import { startingSetup, validSeed, validatePlayers, type BasicStart } from '../game/setup';
export const remotePositions = ['p1', 'p2', 'p3', 'p4'] as const;
export type RemotePosition = typeof remotePositions[number];
export type RemoteSettings = { capacity: 2 | 3 | 4; factions: 'basic' | 'advanced'; achievements: 'introductory' | 'randomized' };
export type RemoteSeat = { uid: string; name: string; ready: boolean };
export type RemoteRoom = { schema: 1; mode: 'remote'; phase: 'gathering' | 'started'; factions?: Partial<Record<RemotePosition,FactionId>>; start?: BasicStart; play?:PlayState; ownerUid: string; code: string; settings: RemoteSettings; seats: Partial<Record<RemotePosition, RemoteSeat>>; members: Record<string, RemotePosition>; configVersion: number; revision: number; lastCommand: string };
export type RemoteCommand = { type: 'game-move' | 'remote-created' | 'remote-seat-claimed' | 'remote-seat-renamed' | 'remote-seat-left' | 'remote-ready-changed' | 'remote-settings-changed' | 'remote-faction-selected' | 'remote-begun'; faction?: FactionId; start?: BasicStart; move?:TurnMove; position: RemotePosition | ''; name: string; ready: boolean; configVersion: number; settings: RemoteSettings; code: string };
export type RemoteEvent = RemoteCommand & { schema: 1; actorUid: string; revision: number; commandId: string };
export const defaultSettings: RemoteSettings = { capacity: 2, factions: 'basic', achievements: 'introductory' };
export function sameSettings(a: RemoteSettings, b: RemoteSettings) { return a.capacity === b.capacity && a.factions === b.factions && a.achievements === b.achievements; }
export function validSettings(settings: RemoteSettings) {
  return [2, 3, 4].includes(settings.capacity) && ['basic', 'advanced'].includes(settings.factions) && ['introductory', 'randomized'].includes(settings.achievements);
}
export function applyRemote(before: RemoteRoom | undefined, e: RemoteEvent): RemoteRoom {
  if (e.schema !== 1 || e.revision !== (before ? before.revision + 1 : 0) || !e.actorUid || !e.commandId || !/^[A-Z]{5}$/.test(e.code) || !validSettings(e.settings)) throw new Error('This room history is incompatible.');
  const validName = e.name.trim() === e.name && e.name.length > 0 && e.name.length <= 24;
  if (!before) {
    if (e.type !== 'remote-created' || e.position !== 'p1' || !validName || e.ready || e.configVersion !== 0) throw new Error('Invalid room creation.');
    return { schema: 1, mode: 'remote', phase: 'gathering', ownerUid: e.actorUid, code: e.code, settings: e.settings, seats: { p1: { uid: e.actorUid, name: e.name, ready: false } }, members: { [e.actorUid]: 'p1' }, configVersion: 0, revision: 0, lastCommand: e.commandId };
  }
  if(e.type==='game-move') {
    if(before.phase!=='started'||!before.start||!e.move||!e.position||before.members[e.actorUid]!==e.position||e.name||e.ready||e.faction||e.start||!sameSettings(e.settings,before.settings)||e.code!==before.code||e.configVersion!==before.configVersion)throw new Error('Only the active faction may make this move.');
    const initial=startingSetup(before.start,remotePositions.filter(p=>before.seats[p]).map(p=>({position:p,name:before.seats[p]!.name,faction:before.factions![p]!})),before.settings);
    return {...before,play:applyTurn(initial,before.play,e.position,e.move,before.start.seed),revision:e.revision,lastCommand:e.commandId};
  }
  if(e.move)throw new Error('Unsupported turn payload.');
  if (before.mode !== 'remote' || before.phase !== 'gathering' || e.code !== before.code) throw new Error('This room has already started or needs a newer client.');
  if (e.type === 'remote-begun') {
    if (e.actorUid !== before.ownerUid || e.position || e.name || e.ready || e.faction || !sameSettings(e.settings,before.settings) || e.configVersion !== before.configVersion || !e.start || e.start.version !== setupVersion || !validSeed(e.start.seed) || Object.keys(before.seats).length !== before.settings.capacity || Object.values(before.seats).some(seat=>!seat?.ready)) throw new Error('Everyone must confirm the complete Basic setup before the host begins.');
    validatePlayers(remotePositions.filter(p=>before.seats[p]).map(p=>({position:p,name:before.seats[p]!.name,faction:before.factions?.[p]!})),before.settings);
    return {...before,phase:'started',start:{...e.start},revision:e.revision,lastCommand:e.commandId};
  }
  if (e.start || (e.faction && e.type !== 'remote-faction-selected')) throw new Error('Unsupported setup payload.');
  const seats = structuredClone(before.seats), members = { ...before.members };
  const choices = {...before.factions};
  const owned = before.members[e.actorUid];
  const unchangedSettings = sameSettings(e.settings, before.settings);
  let changedConfiguration = false;
  if (e.type === 'remote-faction-selected') {
    if (!owned || owned !== e.position || e.name || e.ready || !unchangedSettings || before.settings.factions !== 'basic' || !e.faction || !legalFaction(e.faction,before.settings.capacity) || choices[owned] === e.faction || Object.entries(choices).some(([p,f])=>p!==owned && f===e.faction)) throw new Error('Choose an available legal Basic faction for your seat.');
    choices[owned]=e.faction; changedConfiguration=true;
  } else if (e.type === 'remote-seat-claimed') {
    const index = remotePositions.indexOf(e.position as RemotePosition);
    if (owned || index < 0 || index >= before.settings.capacity || seats[e.position as RemotePosition] || !validName || !unchangedSettings || e.ready) throw new Error('This seat is unavailable. Choose another open seat.');
    seats[e.position as RemotePosition] = { uid: e.actorUid, name: e.name, ready: false };
    members[e.actorUid] = e.position as RemotePosition;
    changedConfiguration = true;
  } else if (e.type === 'remote-seat-renamed') {
    if (!owned || owned !== e.position || !validName || !unchangedSettings || e.ready || seats[owned]!.name === e.name) throw new Error('Only your own name can be changed.');
    seats[owned]!.name = e.name; changedConfiguration = true;
  } else if (e.type === 'remote-seat-left') {
    if (!owned || owned !== e.position || e.actorUid === before.ownerUid || e.name || e.ready || !unchangedSettings) throw new Error('Only a guest can release their own seat.');
    delete seats[owned]; delete members[e.actorUid]; delete choices[owned]; changedConfiguration = true;
  } else if (e.type === 'remote-settings-changed') {
    if (e.actorUid !== before.ownerUid || e.position || e.name || e.ready || unchangedSettings || remotePositions.some((p, i) => i >= e.settings.capacity && seats[p])) throw new Error('Only the host can change setup; occupied seats must remain.');
    for (const p of remotePositions) if (choices[p] && (e.settings.factions !== 'basic' || !legalFaction(choices[p]!,e.settings.capacity))) delete choices[p];
    changedConfiguration = true;
  } else if (e.type === 'remote-ready-changed') {
    if (!owned || owned !== e.position || e.name || !unchangedSettings || seats[owned]!.ready === e.ready) throw new Error('Only your own readiness can be changed.');
    seats[owned]!.ready = e.ready;
  } else throw new Error('Unsupported remote command.');
  const configVersion = before.configVersion + Number(changedConfiguration);
  if (e.configVersion !== configVersion) throw new Error('Room setup changed. Review the current settings before continuing.');
  if (changedConfiguration) for (const seat of Object.values(seats)) seat!.ready = false;
  return { ...before, ...(before.factions || Object.keys(choices).length ? {factions:choices}:{}), seats, members, settings: e.settings, configVersion, revision: e.revision, lastCommand: e.commandId };
}
export function projectRemote(events: RemoteEvent[]): RemoteRoom {
  let room: RemoteRoom | undefined;
  for (const event of events) room = applyRemote(room, event);
  if (!room) throw new Error('This room could not be found.');
  return room;
}
export const remoteRetainedKey = 'beyond-remote-room-v1';
export const lastGameKey = 'beyond-last-game-v1';
