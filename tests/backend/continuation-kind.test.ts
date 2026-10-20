import {test,expect} from 'bun:test';
import {continuationKind} from '../../src/lib/game/continuation-kind';
import {startingSetup} from '../../src/lib/game/setup';
import type {DiscoveryChoice,PublicDiscovery} from '../../src/lib/game/discovery';
import {defaultSettings} from '../../src/lib/remote/model';
function visible(queue:DiscoveryChoice[],actionLocation:string|null=null){
 const game=startingSetup({version:'basic-2020-v1',seed:'77777777-7777-4777-8777-777777777008'},[{position:'p1',name:'Ada',faction:'nishida'},{position:'p2',name:'Bora',faction:'zheng'}],defaultSettings);
 game.players[0].actionLocation=actionLocation;
 // Presentation-only public queue fixtures; no browser/game persistence injection.
 game.discovery={queue} as PublicDiscovery;return game;
}
test('trade control continuation keeps its context for a different responder and through reload/automatic steps',()=>{
 for(const first of [{kind:'control-check',responder:'p1',location:'shipyard-north',source:'Decommission'},{kind:'control-loss',responder:'p1',location:'shipyard-north',source:'Decommission'},{kind:'control',responder:'p2',location:'shipyard-north',source:'Decommission'}] as DiscoveryChoice[]){
  const game=visible([first,{kind:'resume',responder:'p1',returnTo:'trade'}]);expect(continuationKind(game)).toBe('control');expect(continuationKind(structuredClone(game))).toBe('control');
 }
});
test('real discovery and Event queues preserve discovery wording',()=>{
 expect(continuationKind(visible([{kind:'resume',responder:'p1',card:'hypercomputing',slot:'II-1',event:'march-of-progress'}]))).toBe('discovery');
 expect(continuationKind(visible([]))).toBe('discovery');
});
test('printed Action and already-known research remain distinct from trade control',()=>{
 expect(continuationKind(visible([{kind:'resume',responder:'p1',returnTo:'production'}],'technology:narrow-beam-lasers:0:0'))).toBe('action');
 expect(continuationKind(visible([{kind:'resume',responder:'p2',returnTo:'production',card:'psionics'}]))).toBe('research');
});
