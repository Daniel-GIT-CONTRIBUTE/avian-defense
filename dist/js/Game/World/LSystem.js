import * as THREE from 'three';
import { VectorUtil } from '../../Util/VectorUtil.js';

export class LSystem {

	constructor(rules) {
		this.rules = rules;
		this.weight = 0.5;
	}

	generate(axiom, iterations) {
		let current = axiom;

		for (let i = 0; i < iterations; i++) {

			let next = "";

			for (let j = 0; j < current.length; j++) {

				let c = current[j];

				if (this.rules[c]) {
					if ((c == "F") && (Math.random() < 0.2)) {
						next += "F"
					} else {
						next += this.rules[c];
					}
				} else {
					next += c;
				}
			}

			current = next;
		}
		return current;
	}


	createBranch(pointA, pointB, colour) {

		let direction = VectorUtil.sub(pointB, pointA);
		let length = direction.length();

		let geometry = new THREE.CylinderGeometry(this.weight, this.weight, length, 24);

		let quaternion = new THREE.Quaternion()
								  .setFromUnitVectors(
								  	new THREE.Vector3(0,1,0),
								    direction.normalize()
								   );
		geometry.applyQuaternion(quaternion);

		let midpoint = VectorUtil.add(pointA, pointB).multiplyScalar(0.5);
		geometry.translate(midpoint.x, midpoint.y, midpoint.z);

		let material = new THREE.MeshBasicMaterial({ color: colour });
		let cylinder = new THREE.Mesh(geometry, material);

		return cylinder;

	}

	interpret(str, pos1, dir1, angle, color) {
		let stack = [];
		let position = pos1;
		let direction = dir1;
		let tree = new THREE.Group();

		for (let i = 0; i < str.length; i++) {
			let c = str.charAt(i);

			if (c == "F") {

				let newPosition = VectorUtil.add(position, direction);
				let branch = this.createBranch(position, newPosition, color);
				tree.add(branch);
				position = newPosition;
			
			} else if (c == "+") {
				direction.applyAxisAngle(angle, Math.random()*(Math.PI/4));
			} else if (c == "-") {
				direction.applyAxisAngle(angle, Math.random()*(-Math.PI/4));
			} else if (c == "[") {
				stack.push({position: position.clone(), direction: direction.clone()});
			} else if (c == "]") {
				let popped = stack.pop();
				position = popped.position;
				direction = popped.direction;
			} else if (c == "u") {
				this.weight *= 0.75;
			} else if (c == "d") {
				this.weight *= 1/0.75;
			}

		}

		tree.scale.set(1,.5,1);
		return tree;



	}












	
}