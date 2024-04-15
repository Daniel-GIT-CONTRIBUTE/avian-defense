import { Mob } from './Behavior/Mob.js'
import * as THREE from 'three';
import { Resources } from '../Util/Resources.js';
import { BonusBox } from './Behavior/BonusBox.js';
import { BonusMouse } from './Behavior/BonusMouse.js';
// Load resources
// "./public/images/control_icon_white.png"
// let files = [{name: 'L1_monster', url:'../../../dist/public/Models/worm.glb'},
//             {name: 'L2_monster', url:'../../../dist/public/Models/scifi.glb'},
//             {name: 'L3_monster', url:'../../../dist/public/Models/Yoshi.glb'},
//             {name: 'L4_monster', url:'../../../dist/public/Models/borderlands.glb'},
//             {name: 'L5_monster', url:'../../../dist/public/Models/orc2.glb'},
//             {name: 'L6_monster', url:'../../../dist/public/Models/diavoletto.glb'},
//             {name: 'L7_monster', url:'../../../dist/public/Models/dragon.glb'},
//             {name: 'L00_monster', url:'../../../dist/public/Models/box.glb'},
//             {name: 'L01_monster', url:'../../../dist/public/Models/mouse.glb'}
//             ];

let files = [{name: 'L1_monster',url:'../../../dist/public/Models/duck/scene.gltf'},
            {name: 'L2_monster', url:'../../../dist/public/Models/duck/scene.gltf'},
            {name: 'L3_monster', url:'../../../dist/public/Models/duck/scene.gltf'},
            {name: 'L4_monster', url:'../../../dist/public/Models/duck/scene.gltf'},
            {name: 'L5_monster', url:'../../../dist/public/Models/duck/scene.gltf'},
            {name: 'L6_monster', url:'../../../dist/public/Models/duck/scene.gltf'},
            {name: 'L7_monster', url:'../../../dist/public/Models/duck/scene.gltf'},
            {name: 'L00_monster', url:'../../../dist/public/Models/duck/scene.gltf'},
            {name: 'L01_monster', url:'../../../dist/public/Models/duck/scene.gltf'}
            ];
const resources = new Resources(files);
await resources.loadAll();

// Constants holding the stats of each level
const MOB_MODEL = {
	L1: 'L1_monster',
	L2: 'L2_monster',
	L3: 'L3_monster',
    L4: 'L4_monster',
    L5: 'L5_monster',
    L6: 'L6_monster',
    L7: 'L7_monster',
    LBONUS: 'L00_monster',
    LBONUS2: 'L01_monster'
};
const MOB_HP = {
	L1: 10,
	L2: 30,
	L3: 50,
    L4: 100,
    L5: 150,
    L6: 400,
    L7: 1500,
    LBONUS: 3000,
    LBONUS2: 20
};
const WAVE_SIZE = {
	L1: 50,
	L2: 20,
	L3: 20,
    L4: 20,
    L5: 20,
    L6: 20,
    L7: 5,
    LBONUS: 1,
    LBONUS2: 3
};
const MONEY = {
    L1: 100,
    L2: 100,
    L3: 120,
    L4: 180,
    L5: 200,
    L6: 300,
    L7: 500,
    LBONUS: 10000,
    LBONUS2: 300
}


export class MobManager{
    constructor(gameMap, scene, gameManager){
        // Set up variables
        this.gameManager = gameManager;
        this.scene = scene;
        this.mobs = [];
        this.mob_population_limit = 200;
        this.gameMap = gameMap;
        this.spawnNode;
        this.despawnNode;
        this.round = 1;
    }

    
    init(spawn_node_index, despawn_node_index){
        // Setup where the mobs will spawn and where they despawn.
        this.spawnNode = this.gameMap.graph.getTile(spawn_node_index);
        this.despawnNode = this.gameMap.graph.getTile(despawn_node_index);
        this.gameMap.setupSingleGoalFlowField(this.despawnNode);
        // Spawn bonus mobs first (mice and mystery box)
        this.spawnBonusMobs();
    }


    update(deltaTime, gameMap){
        let mob;
        // Update all the mob in the mobs list.
        for(let i = 0; i < this.mobs.length; i++){
            mob = this.mobs[i];
            mob.update(deltaTime, gameMap);
            
            //If a mob reaches the end, subtract player's life
            let quann = gameMap.quantize(mob.location);
            if(quann.id == this.despawnNode.id && !mob.isSpecialMob){
                this.killIndivid(mob, i);
                this.gameManager.subtractPlayerLife();
            }
            //If a mob's hp reaches 0, remove it
            if(mob.hp <= 0){
                this.killIndivid(mob, i);
                this.gameManager.setPlayerMoney(mob.money)
            }
        }
        
    }

    startWave(level){
        // Start the wave according to to instructions of const specified above
        let selected_level = "L" + level;
        let wave_size = WAVE_SIZE[selected_level];

        // Varying spawn speed based on level
        // Slower spawn speed for last round
        let delay = 4000;
        if(level == 1){delay = 2000;}
        if(level == 7){delay = 10000;}
        if(level != 0){
            for(let i =0 ; i < wave_size; i++){
                setTimeout(() => {
                    // Delayed spawning of mob
                    this.spawnMob(level);
                }, delay * (i));
            }
        }
    }


    spawnMob(level){
        // Selecting Mob model and details based on int: level.
        let selected_level = "L" + level;
        let model = MOB_MODEL[selected_level];
        let hp = MOB_HP[selected_level];
        let money = MONEY[selected_level];

        // Proceed as long as total population cap is followed
        if(this.mobs.length < this.mob_population_limit){
            // Create mob
            let mob = new Mob(hp, money);

            //Last Stage is a dragon. Make the size bigger. Else, just leave it to default.
            if(level == 7){mob.size = mob.size*3;}

            // Set model, instruct mob which path to take, add it to a list, and add it to scene.
            mob.setModel(resources.get(model), "mob");
            mob.location = this.gameMap.localize(this.spawnNode);
            mob.setPath(this.gameMap, this.despawnNode);
            this.mobs.push(mob)
            this.scene.add(mob.gameObject);
        } else {
            // Over the population limit
            console.log("Cannot add more mobs");
        }        
    }

    spawnBonusMobs(){
        // Look through the specification in the consts.
        for (let key in MOB_MODEL) {
            // if there are ones marked as bonus, based on specifications, spawn as many as necessary. Ad it to the mobs list.
            if(key.includes('BONUS')){
                let model = MOB_MODEL[key];
                for(let i = 0 ; i < WAVE_SIZE[key]; i++ ){
                    let bonus_mob;
                    if(key == 'LBONUS'){bonus_mob = new BonusBox(MOB_HP['LBONUS'], MONEY['LBONUS']);}
                    if(key == 'LBONUS2'){bonus_mob = new BonusMouse(MOB_HP['LBONUS2'], MONEY['LBONUS2']);}
                    bonus_mob.setModel(resources.get(model), "mob");
                    bonus_mob.location = this.gameMap.getRandomLocation();
                    this.mobs.push(bonus_mob);
                    this.scene.add(bonus_mob.gameObject);
                    }
                }
            }
    }


    killAll(){
        // Parse through all the mob objects in the central mobs list.
        for(let mob of this.mobs){
            // Remove mob from scene
            this.scene.remove(mob);

            // Go the all the mesh/materials/texture and destroy/dispose it.
            mob.gameObject.traverse(function(child) {
                if (child.geometry) {
                    child.geometry.dispose();
                }
                if (child.material) {
                    if (child.material instanceof THREE.Material) {
                        child.material.dispose(); // For single material
                    } else {
                        // For MultiMaterial objects
                        for (const material of child.material) {material.dispose();}
                    }
                }
                if (child.texture) {child.texture.dispose();}
            });
            mob = null;
        }
        this.mobs = [];
        
    }


    killIndivid(mob, index) {
        // Assuming mob.gameObject is the actual Three.js object
        this.scene.remove(mob.gameObject);
        mob.gameObject.traverse((child) => {
            if (child.isMesh) {
                if (child.geometry) {
                    child.geometry.dispose();
                }
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        // Dispose each material in the array
                        child.material.forEach(material => {
                            if (material.map) material.map.dispose();
                            material.dispose();
                        });
                    } else {
                        // Dispose of single material
                        if (child.material.map) child.material.map.dispose();
                        child.material.dispose();
                    }
                }
            }
        });
    
        // Remove the mob reference from the array
        this.mobs.splice(index, 1);
    }
    
    // Given the champ's attack power and mob's index in the mob list, subtract the mob's hp.
    damageMob(index, attack_power){
        let mob = this.mobs[index];
        mob.hp -= attack_power;
        mob.isUnderAttack = true;
    }

}
