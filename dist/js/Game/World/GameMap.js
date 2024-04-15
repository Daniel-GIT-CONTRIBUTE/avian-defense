import { TileNode } from './TileNode.js';
import * as THREE from 'three';
import { MapRenderer } from './MapRenderer.js';
import { Graph } from './Graph.js';
import { PriorityQueue } from '../../Util/PriorityQueue.js';
import { VectorUtil } from '../../Util/VectorUtil.js';


export class GameMap {
	
	// Constructor for our GameMap class
	constructor() {

		this.start = new THREE.Vector3(-50,0,-35);

		this.width = 100;
		this.depth = 70;
	

		// We also need to define a tile size 
		// for our tile based map
		this.tileSize = 5;

		// Get our columns and rows based on
		// width, depth and tile size
		this.cols = this.width/this.tileSize;
		this.rows = this.depth/this.tileSize;

		// Create our graph
		// Which is an array of nodes
		this.graph = new Graph(this.tileSize, this.cols, this.rows);
		

		// Create our map renderer
		this.mapRenderer = new MapRenderer(this.start, this.tileSize, this.cols);

		// Goals for multi goal flow field
		this.goals = [];

		// New 
		//to follow mob path.
		this.mob_path;
		this.mop_path_map = new Map();

		this.shrub_nodes = [];
	}

	// initialize the GameMap
	init(scene) {
		this.scene = scene; 
		this.graph.initGraph();
		// Set the game object to our rendering
		this.gameObject = this.mapRenderer.createRendering(this.graph.nodes);
	}
	// Given a Vector, return an index 
	locToIndex(location){
		let index;
		let x = Math.floor((location.x - this.start.x )/this.tileSize)
		let z = Math.floor((location.z - this.start.z )/this.tileSize)
		let z_comp = this.cols*z;
		let x_comp = x;
		index = z_comp+x_comp;
		if(this.isOOB(index)){index = -1;}
		return index;
	}

	// Given an index, return a vector
	indexToLoc(index){
		return this.localize(this.graph.nodes[index]);
	}

	isOOB(index){
		let isOOB = false;
		if(index >= (this.width*this.depth)/(this.tileSize**2) || index < 0){
			isOOB = true;
			console.log("out of bounds detected");
		}
		return isOOB;
	}

	// Method to get location from a node
	localize(node) {
		let x = this.start.x+(node.x*this.tileSize)+this.tileSize*0.5;
		let y = this.tileSize;
		let z = this.start.z+(node.z*this.tileSize)+this.tileSize*0.5;

		return new THREE.Vector3(x,y,z);
	}

	// Method to get node from a location
	quantize(location) {
		let x = Math.floor((location.x - this.start.x)/this.tileSize);
		let z = Math.floor((location.z - this.start.z)/this.tileSize);
		
		return this.graph.getNode(x,z);
	}

	// Find and return a random location (vector)
	getRandomLocation(){
		let rand_node = this.graph.getRandomEmptyTile();
		return this.localize(rand_node);
	}

	// Makes 
	makeShurbberies(number_of_shrubs){
		let locations = []
		let rand_node_index

		// Make shrubs according to requested number
		for(let i = 0; i < number_of_shrubs; i++){
			// get a random number in range of the map size
				// re-generate random number such that it doesn't overlap with the path nodes.
				// Save the shrub location
			rand_node_index = Math.floor(Math.random()*(this.depth*this.width/(this.tileSize**2)))
			while( this.mob_path.includes(rand_node_index)){rand_node_index = Math.floor(Math.random()*(this.depth*this.width/(this.tileSize**2)))}
			locations.push(this.indexToLoc(rand_node_index));
			
			// Disable building on the shrub tile and save node of the shrub in 
			// the class's list.
			let shrub_node = this.graph.getTile(rand_node_index);
			shrub_node.can_build = false;
			shrub_node.type = TileNode.Type.Shrub;
			this.shrub_nodes.push(shrub_node);
		}
		
		this.mapRenderer.makeNiceShrubberies(this, locations)
	}

	// Returns a list of nodes containing a shrub
	getListOfShrubNodes(){
		return this.shrub_nodes;
	}

	setupSingleGoalFlowField(goal) {
		this.goals = [goal];
		this.setupPath(this.goals);
		this.setupFlowField(this.goals);
	}

	setupPath(goals) {
		// Making path
		this.mob_path = [60,61,62,63,64,65,66,67,68,
			88, 108, 128,
			128,127,126,125,124,123,122,121,
			141, 161, 181, 201,
			202,203,204,
			184,164,144,124,104,84,64,44,24,
			25,26,27,28,29,30,
			50,70,90,110,130,150,170,190,210,230,250,
			249, 248,
			228, 208, 188, 168,
			167, 166,
			186, 206,
			207,208,209,210,211,212,213,214,215,
			235, 255,
			254, 253,
			233,213,193,173,153,133,113,93,73,53,33,13
		]
		// Set all the tiles in the path as "type.Path"
			// 	disable building on that tile.
		for (let i =0; i < this.mob_path.length; i++){
			let tile_node = this.graph.getTile(this.mob_path[i]);
			tile_node.type = TileNode.Type.Path;
			// Mark the path tile as occupied
			tile_node.can_build = false;
		}
		this.makeShurbberies(40);
	}
	
	setupFlowField(goals) {
		this.goals = goals;
		this.heatmap = new Map();
		this.flowfield = new Map();

		let unvisited = [];

		for (let g of goals) {
			unvisited.push(g);
			this.heatmap.set(g, 0);
		}

		let path_cost_accum = 0;
		for(let i = this.mob_path.length-1; i > -1; i-- ){
			let path_node = this.graph.getTile(this.mob_path[i]);
			let cost = path_node.edges[0].cost;
			path_cost_accum += cost;
			this.heatmap.set(path_node, path_cost_accum);
		}
		this.mapRenderer.showFlowField(this);
	}

	setTileType(index, TileNode_dot_Type_dot_Type){
		this.setTileType(this.graph.nodes[index], TileNode_dot_Type_dot_Type);
	}

	setTileTypes(list_of_indexes, TileNode_dot_Type_dot_Type){
		for(let element of list_of_indexes){
			this.setTileType(this.graph.nodes[element], TileNode_dot_Type_dot_Type);
		}
	}

}




















