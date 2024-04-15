import { Champion } from './Behavior/Champion.js';
import * as THREE from 'three';
import { Resources } from '../Util/Resources.js';

// Load resources
let files = [{name: 'champ1', url:'../../../dist/public/Models/birds/1rubber.glb'},
			{name: 'champ2', url:'../../../dist/public/Models/birds/2chicken.glb'},
            {name: 'champ3', url:'../../../dist/public/Models/birds/3pigeon.glb'},
            {name: 'champ4', url:'../../../dist/public/Models/birds/4duck.glb'},
            {name: 'champ5', url:'../../../dist/public/Models/birds/5mallard.glb'},
            {name: 'champ6', url:'../../../dist/public/Models/birds/6gull.glb'},
            {name: 'champ7', url:'../../../dist/public/Models/birds/7goose.glb'},
            {name: 'champ8', url:'../../../dist/public/Models/birds/8gull.glb'},
            {name: 'champ9', url:'../../../dist/public/Models/birds/9goose.glb'},
        ];
const resources = new Resources(files);
await resources.loadAll();

// Constants holding the stats of each level
const ATTACK_POWER = {
	L1: 1,
	L2: 1,
	L3: 2,
    L4: 4,
    L5: 4,
    L6: 3,
    L7: 15,
    L8: 4,
    L9: 30
};
const POWER_IS_RANDOM = {
    L1: false,
	L2: false,
	L3: false,
    L4: false,
    L5: false,
    L6: false,
    L7: true,
    L8: false,
    L9: true   
};
const ATTACK_RANGE = {
	L1: 1,
	L2: 2,
	L3: 4,
    L4: 2,
    L5: 3,
    L6: 4,
    L7: 3,
    L8: 5,
    L9: 5
};
const SIZE_ADJUSTMENT = {
    L1: 1,
    L2: 0.8,
    L3: 0.6,
    L4: 1,
    L5: 1,
    L6: 1.5,
    L7: 1.2,
    L8: 1.4,
    L9: 1.2
}
const CHAMP_NAME = {
	L1: 'champ1',
	L2: 'champ2',
	L3: 'champ3',
    L4: 'champ4',
    L5: 'champ5',
    L6: 'champ6',
    L7: 'champ7',
    L8: 'champ8',
    L9: 'champ9'
};
const CHAMP_PRICE = {
	L1: 40,
	L2: 100,
	L3: 400,
    L4: 600,
    L5: 1000,
    L6: 1200,
    L7: 1500,
    L8: 2000,
    L9: 3000
};


export class ChampionManager{
    constructor(gameMap, scene, mobManager, money, gameManager){
        // Set up variables
        this.gameManager = gameManager;
        this.mobManager = mobManager;
        this.scene = scene;
        this.gameMap = gameMap;
        this.champions = [];
        this.champion_population_limit = 150;
        this.life = 10;
        this.money = money;
    }

    // Helper method to access chapion's price(int) given index
    getPrice(champ_index){
        let champ = "L" + champ_index;
        return CHAMP_PRICE[champ];
    }

    // Helper method to get a list[int] of prices.
    getAllPrice(){
        let price_list = []
        for(let key in CHAMP_PRICE){
            price_list.push(CHAMP_PRICE[key]);
        }
        return price_list;
    }
    
    // Helper method to get a list[int] of all attack range.
    getAllAttackRange(){
        let return_list = []
        for(let key in ATTACK_RANGE){
            return_list.push(ATTACK_RANGE[key]);
        }
        return return_list;
    }
    
    // Helper method to get a list[string] of all the attack power.
    getAllAttackPower(){
        let return_list = []
        for(let key in ATTACK_POWER){
            let attack = '';
            let min_attack = 1;
            if(POWER_IS_RANDOM[key]){
                attack = min_attack.toString() + " - " + ATTACK_POWER[key].toString();
            } else {
                attack = ATTACK_POWER[key].toString();
            } 
            return_list.push(attack);
        }
        return return_list;
    }

    // Args:
    //      level, THREE_VECTOR_location        : (int, Vector)
    // return:
    //      NONE
    // This function adds a champion to the scene based on the constants listed in this class
    spawnChampion(level, THREE_VECTOR_location){
        let selected_model_ID = "L" + level;
        let attack_power = ATTACK_POWER[selected_model_ID];
        let attack_range = ATTACK_RANGE[selected_model_ID];
        let model = CHAMP_NAME[selected_model_ID];
        if(this.champions.length < this.champion_population_limit){
            let champ = new Champion(attack_power, attack_range, POWER_IS_RANDOM[selected_model_ID]);
            champ.setModel(resources.get(model), model, SIZE_ADJUSTMENT[selected_model_ID])
            champ.location = THREE_VECTOR_location;
            this.champions.push(champ);
            this.scene.add(champ.gameObject);
        } else {
            console.log("Cannot add more champions");
        }

    }

    update(deltaTime, gameMap, MobManager){
        for(let i = 0; i < this.champions.length; i++){
            let champ = this.champions[i];
            champ.update(deltaTime, gameMap, MobManager);
       }
    }
    
}