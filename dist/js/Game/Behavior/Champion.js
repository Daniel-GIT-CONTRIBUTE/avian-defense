import * as THREE from 'three';
import { VectorUtil } from '../../Util/VectorUtil.js';
import { Character } from './Character.js';
import { State } from './State.js';
import { Pseudorandom } from '../../Util/Pseudorandom.js';
export class Champion extends Character {

	// Character Constructor
	constructor(attack_power, attack_range, power_is_random) {
		super(0xffffff);
		// Set up variables and enter state
		this.power_is_random = power_is_random;
		this.size = 3;
		this.groundBoundary = (this.size/4)+3.5;
        this.isMobile = false;
        this.target = null;
		this.segment = 0;
		this.path = [];
		this.g_force = -3;
		this.isJumping = false;
		this.attack_range = attack_range;
		this.attack_power = attack_power;
		this.attack_start_time;
		this.attack_interval = 1000;
		this.randNumGen = new Pseudorandom();

		this.state = new AttackState();
		this.state.enterState(this);
	}


	setModel(MODEL, name, size_adjustment) {
		let model = MODEL.clone();
		model.position.y = model.position.y+1;
		
		// Bounding box for the object
		var bbox = new THREE.Box3().setFromObject(model);

		// Get the depth of the object for avoiding collisions
		// Of course we could use a bounding box,
		// but for now we will just use one dimension as "size"
		// (this would work better if the model is square)
		let dz = bbox.max.z-bbox.min.z;

		// Scale the object based on how
		// large we want it to be
		let scale = (this.size/dz)*size_adjustment;
		model.scale.set(scale, scale, scale);

		// Give a label for this model object
		model.traverse((child) => {
			if (child.isMesh) {
				child.material = child.material.clone();
				child.name = name; // Set the name to "duck" for all mesh objects
			}
		});

		this.gameObject = new THREE.Group();
        this.gameObject.add(model);
    }

    switchState(state) {
		this.state = state;
		this.state.enterState(this);
	}

	update(deltaTime, gameMap, mobManager) {
		this.state.updateState(gameMap, this, mobManager);
		super.update(deltaTime, gameMap);
		this.gravity();
	}



	gravity(){
		//Prevent character from sinking below the map
		if (this.location.y < this.groundBoundary) {
			this.location.y = this.groundBoundary;
		}
		//If jumping,apply incremental force to bring it back down
		if(this.isJumping){
			this.velocity.y += this.g_force;
			this.applyForce(this.velocity);	
		} else {
			this.location.y = this.groundBoundary;
		}


	}








	BFSfindMob(gameMap){
		let node = gameMap.quantize(this.location);
		
		let kill_zone_nodes = [];
		let open = []
		let closed = []

		open.push(node);
		closed.push(node);
		kill_zone_nodes.push(node);

		while(open.length > 0){
			let curr_node = open.shift();
			closed.push(curr_node);
			// Cardinal Search
			for(let i =0; i < curr_node.edges.length; i++){
				let edge_node = curr_node.edges[i].node;
				
				// Don't add to open if already in closed
				if (closed.includes(edge_node)){continue;}
				
				// If out of range do not at this node to open
				if (this.isOutOfRange(gameMap, edge_node)){continue;}
				open.push(edge_node);
				kill_zone_nodes.push(edge_node);
			}
		}

		return kill_zone_nodes;
	}

	// Helper 
	isOutOfRange(gameMap, node){
		let node_loc = gameMap.localize(node)
		let champ_loc = this.location;
		if(champ_loc.distanceTo(node_loc) > this.attack_range * (gameMap.tileSize+1) ){
			return true;
		} else {
			return false;
		}
	}

}







export class IdleState extends State {
	enterState(champion) {
	}
	updateState(gameMap, champion, mobManager) {   
		// Look at all the mobs that are currently spawned. If it is in the kill zone. Change state.
		let kill_zone_nodes = champion.BFSfindMob(gameMap);
		for( let i =0; i < mobManager.mobs.length; i ++){
			let mob_node = gameMap.quantize(mobManager.mobs[i].location);
			if(kill_zone_nodes.includes(mob_node)){
				champion.switchState(new AttackState());
			}
		}

	}
}



export class AttackState extends State {
	enterState(champion) {
		champion.topSpeed = 10;
		champion.attack_start_time = Date.now();
	}

	updateState(gameMap, champion, mobManager) {
		let curr_time = Date.now();
		let delta_time = curr_time - champion.attack_start_time;
		let kill_zone_nodes = champion.BFSfindMob(gameMap);
		let target_index;

		// Look at all the mobs that are currently spawned. If it is in the kill zone. Record the target to attack.
		for( let i =0; i < mobManager.mobs.length; i ++){
			let mob_node = gameMap.quantize(mobManager.mobs[i].location);
			if(kill_zone_nodes.includes(mob_node)){
				target_index = i;
			}
		}

		// If there is no target, stop jumping and go to idlestate
		if(target_index == null){
			champion.isJumping = false;
			champion.switchState(new IdleState());
		}

		// Attack at an interval. Record 'attack_start_time' to reset the attack tempo.
			// Actual Attacking
		if( delta_time >= champion.attack_interval && target_index != null ){
			// If this champion has a random attack power, subtract a random number from the mob's hp.
			if(champion.power_is_random){
				let attack_power = champion.randNumGen.lcg(1, champion.attack_power);
				mobManager.damageMob(target_index, attack_power);
				champion.attack_start_time = Date.now();
			// Do a normal attack if the champ is a regular champ.
			} else {
				mobManager.damageMob(target_index, champion.attack_power);
				champion.attack_start_time = Date.now();
			}
			
		}

		// If builder is almost about to hit the ground (from jumping) jump again.
		if ((champion.location.y <= champion.groundBoundary+1)){
			let force = new THREE.Vector3(0,1000,0);
			champion.applyForce(force);
			champion.isJumping = true;
		} 

		

	}

}