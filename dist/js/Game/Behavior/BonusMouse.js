import * as THREE from 'three';
import { VectorUtil } from '../../Util/VectorUtil.js';
import { Character } from './Character.js';
import { State } from './State.js';
import { TileNode } from '../World/TileNode.js';
import { PriorityQueue } from '../../Util/PriorityQueue.js';
export class BonusMouse extends Character{
    constructor(hp, money){
        super(0xffffff);
		
		//declare variables and enter state
        this.money = money;
        this.hp = hp;
        this.wanderAngle;
        this.state = new WanderState();
		this.state.enterState(this);
		this.target = null;
		this.isUnderAttack = false;
		this.attack_start_time;
		this.cool_down = 3000;
		this.isSpecialMob = true;
    }

	switchState(state){
		this.state = state;
		this.state.enterState(this);
	}
    update(deltaTime, gameMap){
		this.state.updateState(gameMap, this);
		super.update(deltaTime, gameMap);
	}

    setModel(MODEL, name) {
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
		let scale = (this.size/dz)*1;
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

	// Same Wander() method used for the previous assignment.
    wander() {
        let d = 10;
        let r = 10;
        let a = 0.3;

        let futureLocation = this.velocity.clone();
        futureLocation.setLength(d);
        futureLocation.add(this.location);

        if (this.wanderAngle == null) {
            this.wanderAngle = Math.random() * (Math.PI*2);
        } else {
            let change = Math.random() * (a*2) - a;
            this.wanderAngle = this.wanderAngle + change;
        }

        let target = new THREE.Vector3(r*Math.sin(this.wanderAngle), 0, r*Math.cos(this.wanderAngle));
        target.add(futureLocation);
        return this.seek(target);

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

	// Seek behavior from class
    seek(target) {
		let desired = new THREE.Vector3();
		desired.subVectors(target, this.location);
		desired.setLength(this.topSpeed);

		let steer = new THREE.Vector3();
		steer.subVectors(desired, this.velocity);
	
		return steer;
	}

	// Helper method
    // Args:
    //    node, end, gameMap (node, node, gameMap)
    // Returns:
    //    int              : manhattanDistance between two nodes
	manhattanDistance(node, end, gameMap) {
		let start_index = node.id;
		let end_index = end.id;
		
		let start_x = Math.floor(start_index/gameMap.cols);
		let end_x = Math.floor(end_index/gameMap.cols);
		
		let start_y = start_index%gameMap.rows;
		let end_y = end_index%gameMap.rows;

		let delta_x = Math.abs(start_x-end_x);
		let delta_y = Math.abs(start_y-end_y);

		let manhatt_displacement = delta_x + delta_y;
		return manhatt_displacement;
	}

    // Args:
    //    startIndex(node), endIndex(node), gameMap(gameMap)
    // Returns:
    //    list[node]              : list of nodes for path finding
	astar(startIndex, endIndex, gameMap) {
		let graph = gameMap.graph.nodes;
		let start_node = graph[startIndex];
		let end_node = graph[endIndex];
		
		// costs: 2d Array containing [[g][f]]. Index is the node id.
		let costs = [];
		let parent = [];

		// Keep track of two lists, an open list and close list
		let closed = [];
		let open = new PriorityQueue;
		// Add the start node to the list
		open.enqueue(start_node, 0);
		
		// For each Node, initialize the g and f value
		// initialize the parent node of the first node to 0.
		for(let node of graph){
			if (node == start_node){costs[node.id] = [0, 0];} 
			else {costs[node.id] = [Number.MAX_VALUE, Number.MAX_VALUE];}
			parent[node.id] = null;
		}

		// Iterating over all of the nodes in our open array.
		while(open.storage.length > 0){
			let f;
			let g;
			let h;

			let curr_node = open.dequeue();
			closed.push(curr_node);			
			for(let edge of curr_node.edges ){
				// costs[node_id][0] is the g value of the current node.
				g = 5 + costs[curr_node.id][0];
				h = this.manhattanDistance(edge.node, graph[endIndex], gameMap)
				f = h+g;
				let curr_path_cost = g;

				// Attribution: https://devdocs.io/javascript/global_objects/array/some
				// If edge is not in the closed list proceed.
				if( ! closed.some( item => (item == edge.node) ) ){
					// If edge is not in the open list, add it to the open list, set the parent node to the current node.
					// Also, record the f, g, and h costs of the node.
					if(! open.includes(edge.node)){
						open.enqueue(edge.node, f);
						parent[edge.node.id] = curr_node;
						costs[edge.node.id][0] = curr_path_cost;
						costs[edge.node.id][1] = f;
						
					} else {
						// Check if this current path is better than the path to the edge node in the open list.
						// Use the g cost.
						// If it is better, change the parent of the edge node to the current node, 
						// and recalculate g and f cost of the edge node.
						if(curr_path_cost < costs[edge.node.id][0]){
							parent[edge.node.id] = curr_node;
							costs[edge.node.id][0] = curr_path_cost;
							costs[edge.node.id][1] = f;
							open.remove(edge.node);
							open.enqueue(edge.node, f);
						}
					}
				}
			}
			
			// Break conditions
			if( closed.some(node => (node == graph[endIndex]))){break;}
			if( open.length == 0){break;}
		}
		return this.backtrack(start_node, end_node, parent);
	}


	// Args:
    //    start(node), end(node), parents(list of nodes)
    // Returns:
    //    list[node]              : the reversed list of parents[]
	backtrack(start, end, parents) {
		let node = end;
		let path = [];
		
		path.push(node);
		while (node != start) {
			if (node == null)
				return;
			path.push(parents[node.id]);
			node = parents[node.id];
		}
		return path.reverse();
	}


}

export class IdleState extends State {
	enterState(mob) {
		mob.topSpeed = 0;
	}
	updateState(gameMap, mob) {   
		if (mob.isUnderAttack) {
			// If under attack, do not go into WanderState.
				// Cancels the switchState() in this else statement.
			clearTimeout(mob.timeOut);
			// Hide in the shrub
			mob.switchState(new HideInShrubState());
		} else {
			// After idle(not attacked) for 3 seconds, to back to wanderState;
			mob.timeOut = setTimeout(function() {
				mob.switchState(new WanderState());
			}, 3000);
		}
	}

}

export class HideInShrubState extends State{
	enterState(mob){
		mob.topSpeed = 3;
	}
	updateState(gameMap, mob){
		{
			let bush_loc = mob.BFSfindShrubLoc(gameMap);
			let steer = mob.seek(bush_loc);
			mob.applyForce(steer);
		}
	}
}


export class RunAwayState extends State{
	enterState(mob){
		mob.topSpeed = 20;
		// Record when it started running way.
		mob.attack_start_time = Date.now();
	}
	updateState(gameMap, mob){
		// Update time
		let curr_time = Date.now();
		// Elapsed time since started running away.
		let delta_time = curr_time - mob.attack_start_time;

		// If ran away for mob.cool_down, switch back to wanderState. 
		if(delta_time >= mob.cool_down){
			mob.isUnderAttack = false;
			mob.target = null;
			mob.switchState(new WanderState());
		
		// If there is no target to go to, get the list of shrubs randomly.
		// Then perform A-Star to the target.
		} else if(mob.target==null){
			// Get a shrub to run away to, and set it as its target
			let list_of_shelters = gameMap.getListOfShrubNodes();
			let rand_shrub_int = Math.floor(Math.random()*(list_of_shelters.length-1))
			let shrub_loc = gameMap.localize(list_of_shelters[rand_shrub_int]);
			mob.target = shrub_loc;
			
			// Get current position and shrub's position, and run a-star
			let curr_index = gameMap.locToIndex(mob.location);
			let target_index = gameMap.locToIndex(mob.target);
			let astar_path = mob.astar(curr_index, target_index,gameMap);			
			astar_path.shift()
			if(astar_path.length != 0){
				let loc_to_go = gameMap.localize(astar_path[0]);
				let steer = mob.arrive(loc_to_go, 3);
				mob.applyForce(steer);
			}
		
		// If currently, running towards a shrub, keep running towards to shrub.
		} else {
			let curr_index = gameMap.locToIndex(mob.location);
			let target_index = gameMap.locToIndex(mob.target);
			let astar_path = mob.astar(curr_index, target_index,gameMap);			
			astar_path.shift()
			if(astar_path.length != 0){
				let loc_to_go = gameMap.localize(astar_path[0]);
				let steer = mob.arrive(loc_to_go, 3);
				mob.applyForce(steer);
			}
		}
	}
}



export class WanderState extends State{
	enterState(mob){
		mob.topSpeed = 1;
	}
	updateState(gameMap, mob){
		if(mob.isUnderAttack){
			mob.switchState(new RunAwayState());
		} else {
			let steer = mob.wander();
			mob.applyForce(steer);
		}
		
	}

}