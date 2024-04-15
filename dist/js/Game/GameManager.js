import * as THREE from 'three';
import { GameMap } from './World/GameMap.js';
import { Builder } from './Behavior/Builder.js';
import { Resources } from '../Util/Resources.js';
import { MobManager } from './MobManager.js';
import { STORE } from './World/STORE.js';
import { ChampionManager } from './ChampionManager.js';

// Load resources
let files = [{name: 'duck', url:'../../../dist/public/Models/duck/scene.gltf'}];
const resources = new Resources(files);
await resources.loadAll();

// Const dictating how long each round is
const ROUND_DURATION = {
    L0: 30000,
    L1: 180000,
    L2: 120000,
    L3: 120000,
    L4: 120000,
    L5: 120000,
    L6: 120000,
    L7: 160000,
}


export class GameManager{
    constructor(scene){
        this.scene = scene;
        // Declaring variables
        this.MobManager;
        this.ChampionManager;
        this.builder;
        this.store;
        this.ready_for_wave;
        this.wave_start_time;
        this.curr_time;
        this.count_down;

        // Set variables for tuning
        this.round = 0;
        this.spawn_node_index = 60;
        this.despawn_node_index = 13;
        this.store_node_index = 16;
        this.builder_node_index = 43;
        this.starting_allowance = 1000;
        this.max_rounds = 7;
        this.isRunning = true;
        this.playerWon = false;
    }

    init(){
        // Init gameMap
        this.gameMap = new GameMap();
        this.gameMap.init(this.scene);
        this.scene.add(this.gameMap.gameObject);

        // Init builder
        this.builder = new Builder();
        this.builder.setModel(resources.get("duck"), "builder");
        this.builder.location =this.gameMap.indexToLoc(this.builder_node_index);
        this.builder.target =this.gameMap.indexToLoc(this.builder_node_index);
        this.scene.add(this.builder.gameObject);

        // Init store
        this.store = new STORE(this.gameMap);
        this.store.location =this.gameMap.indexToLoc(this.store_node_index);
        this.scene.add(this.store.gameObject);

        
        // Init mobManager
        this.MobManager = new MobManager(this.gameMap, this.scene, this);
        this.MobManager.init(this.spawn_node_index, this.despawn_node_index);
        // No init required for chapmion manager besides calling
        this.ChampionManager = new ChampionManager(this.gameMap, this.scene, this.MobManager, this.starting_allowance, this);        

        
        this.ready_for_wave = true;
    }

    update(deltaTime){
        // Update all the dependent lower level managers
        this.builder.update(deltaTime,this.gameMap, this.MobManager);
	    this.store.update(deltaTime,this.gameMap);
	    this.ChampionManager.update(deltaTime,this.gameMap, this.MobManager);
	    this.MobManager.update(deltaTime,this.gameMap);
        
        // Run this master manager's loop.
        if(this.isRunning){
            this.gameLoop();
        }
    }

    // Game Loop 
    gameLoop(){
        // Record current time, and get the level information based on round
        this.curr_time = Date.now();
        let selected_level = "L" + this.round;
        let duration = ROUND_DURATION[selected_level];

        // If ready_for_wave is true, start the wave
        if(this.ready_for_wave){
            this.startWave(this.round)
            this.ready_for_wave = false;
        }

        // If round's time is up, start the next round.
        if(this.curr_time - this.wave_start_time >= duration){
            this.ready_for_wave = true; 
            
            // If round time is up after the last round, mark that player has won.
            if(this.round == 7){     
                this.playerWon = true;
            }

            //Flag for next round to start
            if(this.round < 7){
                this.round+=1;
            }
            
            

        }
        this.count_down = duration - (this.curr_time - this.wave_start_time); 
        if(Number.isNaN(this.count_down)){this.count_down = 0;}
    }

    // Starts the wave, and records when wave started to be used for user UI clock. 
    startWave(round){
        this.MobManager.startWave(round);
        this.wave_start_time = Date.now();
    }

    // For debugging purposes
    countdown(seconds) {
        let timer = setInterval(function() {
            if (seconds <= 0) {
                clearInterval(timer);
                return true;
            } else {
                const minutes = Math.floor(seconds / 60);
                const remainingSeconds = seconds % 60;
                const formattedMinutes = String(minutes).padStart(2, '0');
                const formattedSeconds = String(remainingSeconds).padStart(2, '0');
                seconds--;
            }
        }, 1000); 
    }


    // Helper/Middle Man methods 
    skipRound(){
        if(this.round < this.max_rounds){
            this.ready_for_wave = true; 
            this.round+=1;
        }
        
    }

    getCountDown(){
        return this.count_down;
    }
    getRound(){
        return this.round;
    }
    getPlayerLife(){
        return this.ChampionManager.life;
    }
    getPlayerMoney(){
        return this.ChampionManager.money;
    }
    getPlayerUnitCount(){
        return this.ChampionManager.champions.length;
    }
    setPlayerMoney(number){
        this.ChampionManager.money += number;
    }
    subtractPlayerLife(){
        let life = this.ChampionManager.life;
        if( (life - 1) == 0 ){
            this.ChampionManager.life -= 1;    
        } else {
            this.ChampionManager.life -= 1;    
        }
    }

    purchaseChamp(champ_index, location){
        let price = this.ChampionManager.getPrice(champ_index);
        if( (this.ChampionManager.money - price) < 0 ){
            return false;
        } else {
            this.setPlayerMoney(-price);
            this.ChampionManager.spawnChampion(champ_index, location);
            let this_node = this.gameMap.quantize(location);
            this_node.can_build = false;
            return true;
        }
        
    }

    getChampionPriceList(){
        let price_list = this.ChampionManager.getAllPrice();
        return price_list;
    }

    getChampionAttackRangeList(){
        let return_list = this.ChampionManager.getAllAttackRange();
        return return_list
    }

    getChampionAttackPowerList(){
        let return_list = this.ChampionManager.getAllAttackPower();
        return return_list
    }

}