const test=require('node:test'),a=require('node:assert/strict');global.window=global;require('../assets/scene-data.js');const R=require('../assets/game.js');
test('every inventory resource participates in real crafting costs or a quest',()=>{
 const used=new Set();for(const r of Object.values(R.recipes))for(const k of Object.keys(r.cost))used.add(k);
 for(const i of Object.values(R.GEAR))for(const k of Object.keys(i.cost))used.add(k);
 // These two inventory consumables are actually checked by the ravine/wolf quests.
 used.add('food');used.add('trap');for(const k of Object.keys(R.BEACON_COST))used.add(k);
 for(const k of Object.keys(R.names)){a.ok(used.has(k),`${k} has no crafting or quest use`);a.ok(R.resourceUses(k).length,`${k} missing from guide`);}
});
test('every loot source returns known resources with a crafting or quest purpose',()=>{
 const s=R.fresh('Audit');const loot=[];
 for(const p of R.places)for(const g of p.gather||[])loot.push(g.loot(s));
 for(const sc of Object.values(global.SCENES))for(const o of sc.objects)loot.push(o.loot);
 loot.push(...Object.values(R.DROPS));
 for(const bundle of loot)for(const k of Object.keys(bundle)){a.ok(R.names[k],`Unknown loot ${k}`);a.ok(R.resourceUses(k).length,`Unused loot ${k}`);}
});
test('berry rations and broth require fire, consume actual inputs and yield edible rations',()=>{
 for(const [id,cost] of [['berryrations',{berry:4,water:1}],['broth',{meat:1,water:1}]]){
  const s=R.fresh('Cook');s.inv={...cost,log:10};a.match(R.craft(s,id),/campfire/);a.deepEqual(Object.fromEntries(Object.keys(cost).map(k=>[k,s.inv[k]])),cost);
  s.flags.fire=true;a.match(R.craft(s,id),/Built/);for(const k of Object.keys(cost))a.equal(s.inv[k],0);a.equal(s.inv.food,2);a.equal(s.minute,0);s.food=50;R.use(s,'eat');a.equal(s.food,80);a.equal(s.inv.food,1);
 }
});
test('quest components have concrete purposes and cooking cannot bypass a stranger',()=>{a.ok(R.resourceUses('alternator').some(x=>x.includes('transmitter')));a.ok(R.resourceUses('riftGlass').some(x=>x.includes('beacon')));const s=R.fresh('Cook');s.flags.fire=true;s.inv={berry:4,water:1};s.stranger={name:'Ada'};a.match(R.craft(s,'berryrations'),/stranger/);a.equal(s.inv.berry,4);});

test('crafting, gear and shelter upgrades consume materials but no time or energy even when exhausted',()=>{const s=R.fresh('Maker');s.flags.shelter=true;s.shelters=[{level:0}];s.energy=0;for(const k of Object.keys(R.names))s.inv[k]=100;const before=JSON.stringify([s.day,s.hour,s.minute,s.energy]);R.craft(s,'rope');a.equal(s.inv.leaf,95);R.craftGear(s,'shirt');a.equal(s.gearBag.shirt1,1);R.upgradeGear(s,'bag:shirt1');a.equal(s.gearBag.shirt2,1);R.buildShelter(s);a.equal(s.shelters.length,2);R.upgradeShelter(s,0);a.equal(s.shelters[0].level,1);a.equal(JSON.stringify([s.day,s.hour,s.minute,s.energy]),before);});
