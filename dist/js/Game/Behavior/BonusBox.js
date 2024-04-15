import * as THREE from 'three';
import { VectorUtil } from '../../Util/VectorUtil.js';
import { Character } from './Character.js';
import { State } from './State.js';

export class BonusBox extends Character{
    constructor(hp, money){
        super(0xffffff);

		//declare variables and enter state
        this.money = money;
        this.hp = hp;
        this.wanderAngle;
        this.state = new WanderState();
		this.state.enterState(this);
		this.isUnderAttack = false;
		this.isSpecialMob = true;
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

	// Simple Seek
    seek(target) {
		let desired = new THREE.Vector3();
		desired.subVectors(target, this.location);
		desired.setLength(this.topSpeed);

		let steer = new THREE.Vector3();
		steer.subVectors(desired, this.velocity);
	
		return steer;
	}
}


export class WanderState extends State{
	enterState(mob){
		mob.topSpeed = 3;
	}
	updateState(gameMap, mob){
		let steer = mob.wander();
        mob.applyForce(steer);
	}

}
