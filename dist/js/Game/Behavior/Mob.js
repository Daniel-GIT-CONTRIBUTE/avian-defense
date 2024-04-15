import * as THREE from 'three';
import { VectorUtil } from '../../Util/VectorUtil.js';
import { Character } from './Character.js';
import { TileNode } from '../World/TileNode.js';
import { State } from './State.js';
export class Mob extends Character {

	// Character Constructor
	constructor(health_power, money) {
		super(0xEE4B2B);

		// Set up variables and enter state
		this.segment = 0;
		this.path = [];
		this.despawnZone;
		this.isSpecialMob = false;
		this.hp = health_power;
		this.money = money;
		this.isUnderAttack = false;

		this.state = new MovingState();
		this.state.enterState(this);
	}


	switchState(state){
		this.state = state;
		this.state.enterState(this);
	}

	update(deltaTime, gameMap){
		this.state.updateState(gameMap, this);
		super.update(deltaTime, gameMap);
	}

	seek(target) {
		let desired = new THREE.Vector3();
		desired.subVectors(target, this.location);
		desired.setLength(this.topSpeed);

		let steer = new THREE.Vector3();
		steer.subVectors(desired, this.velocity);

		if (steer.length() > this.maxForce) {
			steer.setLength(this.maxForce);
		}
		return steer;
	}

	// Arrive steering behaviour
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


	flow(gameMap) {
		let node = gameMap.quantize(this.location);
		let steer = new THREE.Vector3();

		if (node != gameMap.goal) {
			let desired = gameMap.flowfield.get(node);
			desired.setLength(this.topSpeed);
			steer = VectorUtil.sub(desired, this.velocity);
		} else {
			let nodeLocation = gameMap.localize(node);
			steer = this.arrive(nodeLocation, gameMap.tileSize/2);
		}

		return steer;
	}

	interactiveFlow(gameMap) {
		return this.flow(gameMap);
	}


	setPath(gameMap, endNode){
		this.despawnZone = endNode;
		for (let i =0 ; i < gameMap.mob_path.length; i++){
			let index = gameMap.mob_path[i];
			let node = gameMap.graph.getTile(index);
			this.path.push(node);
		}
		// this.path.push(current_node)

		this.path.reverse();

	}


	pathFollow(gameMap){
		let node = gameMap.quantize(this.location);

		let steer = new THREE.Vector3();

		if (node != this.despawnZone) {
			let path_segment = this.path.pop();
			console.log(path_segment);
			let desired = gameMap.localize(this.path.pop());
			desired.setLength(this.topSpeed);
			steer = VectorUtil.sub(desired, this.velocity);
		} else {
			let nodeLocation = gameMap.localize(node);
			steer = this.arrive(nodeLocation, gameMap.tileSize/2);

		}
		return steer;
	}


}




export class MovingState extends State{
	enterState(mob){
		mob.topSpeed = 5;
	}
	updateState(gameMap, mob){
		let immediate_goal_node = mob.path[mob.path.length-1];
		
		if(gameMap.quantize(mob.location) !== mob.despawnZone){

			if(gameMap.quantize(mob.location) == immediate_goal_node ){
				mob.path.pop();
				mob.switchState(new MovingState);
			} else {
				let steer = mob.seek(gameMap.localize(immediate_goal_node));
				mob.applyForce(steer);
			}
		} else {
			// do nothing
		}
	}

}



