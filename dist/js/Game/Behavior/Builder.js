import * as THREE from 'three';
import { VectorUtil } from '../../Util/VectorUtil.js';
import { Character } from './Character.js';
import { State } from './State.js';
import { PriorityQueue } from '../../Util/PriorityQueue.js';
export class Builder extends Character {

	// Character Constructor
	constructor() {
		super(0xffffff);
		// Set up variables and enter state
		this.size = 3;
		this.groundBoundary = (this.size/4)+3.2;
        this.isMobile = false;
        this.target = null;
		this.segment = 0;
		this.path = [];
		this.g_force = -2;
		this.isJumping = false;
		this.attack_range = 1;
		this.attack_power = 1;
		this.attack_start_time;
		this.attack_interval = 1000;
		this.location.y = this.groundBoundary;

		this.state = new IdleState();
		this.state.enterState(this);
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

	// Seek steering Behavior
	seek(target) {
		let desired = new THREE.Vector3();
		desired.subVectors(target, this.location);
		desired.setLength(this.topSpeed);

		let steer = new THREE.Vector3();
		steer.subVectors(desired, this.velocity);

	
		return steer;
	}

	// Arrive steering Behavior
	arrive(target, radius) {
		let desired = VectorUtil.sub(target, this.location);
		let distance = desired.length();

		if (distance < radius) {
			let speed = (distance/radius) * this.topSpeed;
			desired.setLength(speed);
			
		} else {
			desired.setLength(this.topSpeed);
		} 

		let steer = VectorUtil.sub(desired, this.velocity);

		return steer;
	}



	BFSfindMob(gameMap){
		let node = gameMap.quantize(this.location);
		let node_abs_location = gameMap.localize(node);
		let node_index = gameMap.locToIndex(node_abs_location);
		// locToIndex returns -1 if out if invalid location was given
		let kill_zone_nodes = [];
		kill_zone_nodes.push(node);
		

		let upper_left_corner_index = node_index - 1 - (gameMap.width/gameMap.tileSize)*this.attack_range;
		let num_of_rows = 1 + this.attack_range*2;

		let row = upper_left_corner_index;
		for(let i = 0; i < num_of_rows; i++){
			// left to right scan
			for (let j = 0; j < num_of_rows; j++){
				kill_zone_nodes.push(gameMap.graph.getTile([row+j]));
			}
			// up to down index traversing
			row += ( gameMap.width / gameMap.tileSize );
		}
		
		return kill_zone_nodes;

	}
	
	isOOB(gameMap, index){
		let isOOB = false;
		if(index >= (gameMap.width*this.depth)/(gameMap.tileSize**2) || index < 0){
			isOOB = true;
		}
		return isOOB;
	}





}


export class IdleState extends State {
	enterState(builder) {
		builder.topSpeed = 0;
		builder.isJumping = false;
	}
	updateState(gameMap, builder, mobManager) {   
		// If player clicked on this unit, switch to waiting state to wait for user input
		if (builder.isMobile) {
			builder.switchState(new WaitingState());
		} else {
			// Check if there are any enemies around.
			let kill_zone_nodes = builder.BFSfindMob(gameMap);
			for( let i =0; i < mobManager.mobs.length; i ++){
				let mob_node = gameMap.quantize(mobManager.mobs[i].location);
				// If enemy found, change state.
				if(kill_zone_nodes.includes(mob_node)){
					builder.switchState(new AttackState());
				}
			}

			
		}

	}
}

export class WaitingState extends State{
    enterState(builder){
        builder.topSpeed = 0;
		// Stop jumping
		builder.isJumping = false;
    }

    updateState(gameMap, builder, mobManager){
		// Round the builder and target location to 1 decimal place.
		let cx = builder.location.x;
		cx = cx.toFixed(1);
		let cy = builder.location.y;
		cy = cy.toFixed(1);
		let tx = builder.target.x;
		tx = tx.toFixed(1);
		let ty = builder.target.y;
		ty = ty.toFixed(1);
		
		// If builder is not TOO close the the target(clicked location), move there
		if(cx  !== tx || cy !== ty ){
			builder.switchState(new RelocateState());
        } else {
			// Do nothing. Stay in the waiting state for user to click somewhere farther away.
		}
        
    }
}

export class RelocateState extends State{
    enterState(builder){
        builder.topSpeed = 10;
    }
    updateState(gameMap, builder, mobManager){
		// Get the location difference between target and builder's locactions.
		let cx = builder.location.x;
		let cz = builder.location.z;
		let tx = builder.target.x;
		let tz = builder.target.z;
		let x_dif = Math.abs(cx - tx)
		let z_dif = Math.abs(cz - tz)

		// If arrived arrived at the target
        if( (x_dif < .8 && z_dif < .8) ){
			// If player unselected the duck, go to idleState
			if(!builder.isMobile){
				builder.topSpeed = 0;
				builder.BFSfindMob(gameMap);
				builder.switchState(new IdleState);    
			// If builder is still selected, switch to waitingstate and await user's instruction				
			} else {
				builder.topSpeed = 0;
				builder.switchState(new WaitingState);
			}
		// If not at target, keep moving towards the target
        } else {
			let steer = builder.arrive(builder.target, 3);
			builder.applyForce(steer);
        }
    }

}


export class AttackState extends State {
	enterState(builder) {
		builder.topSpeed = 10;
		builder.attack_start_time = Date.now();
	}

	updateState(gameMap, builder, mobManager) {
		let curr_time = Date.now();
		let delta_time = curr_time - builder.attack_start_time;
		let kill_zone_nodes = builder.BFSfindMob(gameMap);
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
			builder.isJumping = false;
			builder.switchState(new IdleState());
		}

		// Attack at an interval. Record 'attack_start_time' to reset the attack tempo.
			// Actual Attacking
		if( delta_time >= builder.attack_interval && target_index != null ){
			if ((builder.location.y <= builder.groundBoundary+1)){
				let force = new THREE.Vector3(0,5000,0);
				builder.applyForce(force);
				builder.isJumping = true;
			} 
			mobManager.damageMob(target_index, builder.attack_power);
			builder.attack_start_time = Date.now();
		}
		
		// If builder is almost about to hit the ground (from jumping) jump again.
			// Animation purpose
		if ((builder.location.y <= builder.groundBoundary+1)){
			let force = new THREE.Vector3(0,300,0);
			builder.applyForce(force);
			builder.isJumping = true;
		} 

		// If the player selected this builder, stop attacking/jumping.
		if (builder.isMobile){
			builder.isJumping = false;
			builder.switchState(new IdleState());
		}

		// If there is no enemy, stop attacking/jumping.
		if (mobManager.mobs.length == 0){
			builder.isJumping = false;
			builder.switchState(new IdleState());
		} 

		

	}

}