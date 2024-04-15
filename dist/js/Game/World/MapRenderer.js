import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';
import { TileNode } from './TileNode.js'
import { LSystem } from './LSystem.js';
const textureLoader = new THREE.TextureLoader();

export class MapRenderer {

	constructor(start, tileSize, cols) {

		this.start = start;
		this.tileSize = tileSize;
		this.cols = cols;

		this.groundGeometries = new THREE.BoxGeometry(0,0,0);
		this.obstacleGeometries = new THREE.BoxGeometry(0,0,0);

	
	}

	createRendering(graph) {
		// Iterate over all of the 
		// indices in our graph
		for (let index in graph) {
			let i = index % this.cols;
			let j = Math.floor(index/this.cols);

			this.createTile(i, j, graph[index].type);

		}
		
		let texture = textureLoader.load('../../../dist/public/images/Grass.png');
		let groundMaterial = new THREE.MeshStandardMaterial({ map: texture });
		let gameObject = new THREE.Group();
		let ground = new THREE.Mesh(this.groundGeometries, groundMaterial);
		ground.name = 'ground';

		gameObject.add(ground);

		return gameObject;
	}

	createTile(i, j, type) {

		let x = (i * this.tileSize) + this.start.x;
		let y = 0;
		let z = (j * this.tileSize) + this.start.z;

		let height = this.tileSize;


		let geometry = new THREE.BoxGeometry(this.tileSize,
											 height, 
											 this.tileSize);
		geometry.translate(x + 0.5 * this.tileSize,
						   y + 0.5 * height,
						   z + 0.5 * this.tileSize);

		this.groundGeometries = BufferGeometryUtils.mergeGeometries(
									[this.groundGeometries,
									geometry]
								);
	}


	// Debug method
	highlight(vec, texture_or_color) {
		let geometry = new THREE.BoxGeometry( this.tileSize, 0.4, this.tileSize ); 
		
		
		let is_not_color;
		if(texture_or_color.isTexture){
			is_not_color = true;
		} else {
			is_not_color = false;
		}
		
		let material;
		let mesh;
		if(is_not_color){
			material = new THREE.MeshBasicMaterial( { map: texture_or_color } ); 
			mesh = new THREE.Mesh( geometry, material );
			mesh.name = 'ground';
		} else {
			material = new THREE.MeshBasicMaterial( { color: texture_or_color } ); 
			mesh = new THREE.Mesh( geometry, material );
			mesh.name = 'path';
		}
		
		
		geometry.translate(vec.x, vec.y+0.5, vec.z);
		this.flowfieldGraphics.add(mesh);
		
	}

	// Debug method
	arrow(pos, vector) {

		vector.normalize();
		let origin = pos.clone();
		origin.y += 1.5;
		let length = this.tileSize;
		let hex = 0x000000;

		let arrowHelper = new THREE.ArrowHelper( vector, origin, length, hex );
		this.flowfieldGraphics.add( arrowHelper );

	}

	// Modified showFlowField
	// Debug method
	showFlowField(gameMap) {
		if ((this.flowfieldGraphics != undefined) 
			&& (this.flowfieldGraphics.children.length > 0)) {
				gameMap.scene.remove(this.flowfieldGraphics);
			
		}
		this.flowfieldGraphics = new THREE.Group();
			
		for (let [n,i] of gameMap.heatmap) {
			let nPos = gameMap.localize(n);
			if ((n == gameMap.goal) || (gameMap.goals.includes(n))) {
				this.highlight(nPos, new THREE.Color(0xffffff));
			} else {
				// Limit the color range to red - green
				if(i > 50){
					i = 50;
				}
				this.highlight(nPos, new THREE.Color('hsl('+i*2+', 100%, 50%)'));
				if (gameMap.flowfield.size != 0)
					this.arrow(nPos, gameMap.flowfield.get(n));
			}
			
		}
		gameMap.scene.add(this.flowfieldGraphics);
	}

	// Args:
	//		gameMap(gameMap object), locations[list of vectors]
	// Return:
	//		none
	makeNiceShrubberies(gameMap, locations){
		// Make a shrubbery for each location
		for (let i =0; i < locations.length; i++){
			this.makeShrubbery(gameMap, locations[i])
		}
	}

	// Args:
	//		gameMap(gameMap object), location(single 3Dvector)
	// Return:
	//		none
	makeShrubbery(gameMap, location){
		location.y += (gameMap.tileSize/2);
		// Rules for the shrubbery.
		let rules = {
			"X": "F[u+FXd][u-FXd]",
			"F": "FF"
		};
		let axiom = "X";
		let lsystem = new LSystem(rules);
		let str = lsystem.generate(axiom, 2);
		// Make the first stem for the shrubbery
		let shrubbery_side1 = lsystem.interpret(str, location, 
										new THREE.Vector3(0,.8,0),
										new THREE.Vector3(0,0,1), 
										'darkgreen');
		gameMap.scene.add(shrubbery_side1);										

		// Makes the Shrubbery look nicer (fuller)
		let angle1 = 0
		let angle2 = -1
		for(let i =0; i < 5; i++){
			let random_angle_vect = new THREE.Vector3(angle2,0,-angle1);
			let tree = lsystem.interpret(str, location, 
										new THREE.Vector3(0,.8,0),
										random_angle_vect, 
										'darkgreen');
			gameMap.scene.add(tree);
			angle1 += 0.3;
			angle2 += 0.15;
		}
	
		// Makes the Shrubbery look nicer (fuller)
		let angle3 = 0
		let angle4 = 1
		for(let i =0; i < 5; i++){
			let random_angle_vect = new THREE.Vector3(-angle3,0,angle4);
			let tree = lsystem.interpret(str, location, 
										new THREE.Vector3(0,.8,0),
										random_angle_vect, 
										'darkgreen');
			gameMap.scene.add(tree);
			angle3 += 0.3;
			angle4 -= 0.15;
		}
	}

}