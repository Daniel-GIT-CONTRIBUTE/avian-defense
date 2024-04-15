import * as THREE from 'three';
const textureLoader = new THREE.TextureLoader();
export class STORE {

	// Character Constructor
    constructor(gameMap) {
		this.size = 10;
        let green = 0x228B22;
		let gray_brown = 0x807767;
		let black = 0x000000;
		let walle_color = 0xd1a53f;

		// Body
        let bodyGeometry = new THREE.BoxGeometry(8, 3.6, 8);
		let bodyMaterial = new THREE.MeshBasicMaterial({ color: walle_color });
		let upperBodyGeometry = new THREE.BoxGeometry(8, 1.6, 8);
		let upperBodyMaterial = new THREE.MeshBasicMaterial({ color: gray_brown });
        let body = new THREE.Mesh(bodyGeometry, bodyMaterial);
		let upperBody = new THREE.Mesh(upperBodyGeometry, upperBodyMaterial);
        // Head
		let headGeometry = new THREE.SphereGeometry(2, 10, 10);
        let headMaterial = new THREE.MeshBasicMaterial({ color: 0xeba765 });
        let head = new THREE.Mesh(headGeometry, headMaterial);
		// Neck
		let neckGeometry = new THREE.BoxGeometry(1, 7, 1);
        let neckMaterial = new THREE.MeshBasicMaterial({ color: walle_color });
        let neck = new THREE.Mesh(neckGeometry, neckMaterial);
		// Eyes
        let eyeGeometry = new THREE.BoxGeometry(2, 6, 2);
        let eyeMaterial = new THREE.MeshBasicMaterial({ color: walle_color });
        let rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        let leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
		//Left Eye (LE) and Right Eye (RE) MESH
		let simpleEyeGeom = new THREE.PlaneGeometry(2.4, 2);
		let textureRE = textureLoader.load('../../../dist/public/images/RightEye.png');
		let MaterialRE = new THREE.MeshBasicMaterial({map : textureRE});
		let textureLE = textureLoader.load('../../../dist/public/images/LeftEye.png');
		let MaterialLE = new THREE.MeshBasicMaterial({map : textureLE});
        let MeshRE = new THREE.Mesh(simpleEyeGeom, MaterialRE);
        let MeshLE = new THREE.Mesh(simpleEyeGeom, MaterialLE);
        // Arms
        let armGeometry = new THREE.BoxGeometry(1, 7, 1);
        let armMaterial = new THREE.MeshBasicMaterial({ color: gray_brown });
        let leftArm = new THREE.Mesh(armGeometry, armMaterial);
        let rightArm = new THREE.Mesh(armGeometry, armMaterial);
		// Hands
		let handGeometry = new THREE.BoxGeometry(0.4, 1, 3);
        let handMaterial = new THREE.MeshBasicMaterial({ color: 0xc0c0c0 });
        let leftHand1 = new THREE.Mesh(handGeometry, handMaterial);
        let rightHand1 = new THREE.Mesh(handGeometry, handMaterial);
		let leftHand2 = new THREE.Mesh(handGeometry, handMaterial);
		let rightHand2 = new THREE.Mesh(handGeometry, handMaterial);
        // wheel
        let wheelGeometry = new THREE.BoxGeometry(3, 2, 8);
        let wheelMaterial = new THREE.MeshBasicMaterial({ color: black });
        let leftWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
		let rightWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);

		//Height adjustments 
		rightEye.position.y = rightEye.position.y+10;
        leftEye.position.y = leftEye.position.y+10;
		MeshRE.position.y = MeshRE.position.y+10;
        MeshLE.position.y = MeshLE.position.y+10;
		neck.position.y = neck.position.y + 6;
        body.position.y = body.position.y+4;
		upperBody.position.y = upperBody.position.y+6.6;
        rightArm.position.y =  rightArm.position.y+6;
		leftArm.position.y = leftArm.position.y+6;
		rightHand1.position.y =  rightHand1.position.y+7;
		rightHand2.position.y =  rightHand2.position.y+5.6;
		leftHand1.position.y =  leftHand1.position.y+7;
		leftHand2.position.y =  leftHand2.position.y+5.6;
		
		//X-dimension adjustments
		leftWheel.position.x = leftWheel.position.x+2;
		rightWheel.position.x = rightWheel.position.x -2;
		MeshRE.position.x = MeshRE.position.x-1.2;
        MeshLE.position.x = MeshLE.position.x+1.2;
        rightEye.position.x = rightEye.position.x+1.4;
        leftEye.position.x = leftEye.position.x-1.4;
        leftArm.position.x = leftArm.position.x-4;
        rightArm.position.x =  rightArm.position.x+4;
        leftHand1.position.x =  leftHand1.position.x-3;
		rightHand1.position.x =  rightHand1.position.x+3;
		leftHand2.position.x =  leftHand2.position.x-3;
		rightHand2.position.x =  rightHand2.position.x+3;

		//Z-dimension adjustments
		MeshRE.position.z = MeshRE.position.z+3.2;
        MeshLE.position.z = MeshLE.position.z+3.2;
		leftHand1.position.z =  leftHand1.position.z+8.4;
		rightHand1.position.z =  rightHand1.position.z+8.4;
		leftHand2.position.z =  leftHand2.position.z+8.4;
		rightHand2.position.z =  rightHand2.position.z+8.4;
		leftArm.position.z = leftArm.position.z+4;
        rightArm.position.z =  rightArm.position.z+4;

		// Rotation of parts in the game map
		leftHand1.rotateY(7); 
		rightHand1.rotateY(-7);
		leftHand2.rotateY(7);
		rightHand2.rotateY(-7);
		head.rotateX(Math.PI/2);
        rightEye.rotateX(Math.PI/2);
        leftEye.rotateX(Math.PI/2);
        leftArm.rotateX(Math.PI/2);
        rightArm.rotateX(Math.PI/2);
		
		let list_of_mesh = [body, upperBody, neck, 
			rightEye, leftEye, MeshRE, MeshLE, rightArm, leftArm, 
			rightHand1, leftHand1, rightHand2, leftHand2, rightWheel, leftWheel]
		// Add our mesh to a Group to serve as the game object
        this.gameObject = new THREE.Group();
		for (let element of list_of_mesh){
			element.name = 'store';
			this.gameObject.add(element);
		}

		// Initialize movement variables
		this.location = new THREE.Vector3(0,0,0);
		
	}

    

	// update character
	update(gameMap, deltaTime) {
		// This is the big Wall-E statue. This does not move. So keep it in place. 
		this.gameObject.position.set(this.location.x, this.location.y+1, this.location.z);
	}



}
