import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GameManager } from './Game/GameManager.js';

// Create Scene and camera
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
const orbitControls = new OrbitControls(camera, renderer.domElement);

// Create clock
const clock = new THREE.Clock();

// Create music and music bool
let GAME_MUSIC = new Audio('../../public/music/retro.mp3');
let MUSIC_IS_ON = false;
GAME_MUSIC.muted = true;


// Declare variables 
let gameManager;
let gameMap;
let user_warning_message = null;
let user_warning_flag_raised;
let isRunning = true;

// Create helper for click location tracking
// Set up variables for mouse clicks
const raycaster = new THREE.Raycaster();
let INTERSECTED;
let selected_obj;
let plane;


// Handles all the Left Click actions.
//
//
function onMouseClick(event){
	// Handle button clicks
	if(event.target.id.includes('champ')){
		let substring = event.target.id.split(' ');
		let champ_id = substring[1];
		let builder_node = gameMap.quantize(gameManager.builder.location)
		if(builder_node.can_build){
			let purchase_successful = gameManager.purchaseChamp(champ_id, gameMap.localize(builder_node));
			if(!purchase_successful){
				user_warning_flag_raised = true;
				user_warning_message = "Insufficient funds!";
			}
		} else {
			user_warning_flag_raised = true;
			user_warning_message = "Cannot build here!";
		}
		// Ignore the rest of the code
		return;
	}

	// Handles Button Press of 'skip'
	if(event.target.id.includes('skip')){
		gameManager.skipRound();
	}

	// Handles Button Press of 'pause'
	if(event.target.id.includes('pause')){
		if(isRunning){
			isRunning = false;
		} else {
			isRunning = true;
			clock.start();
		}
	}

	// Handles Button Press of 'music'
	if(event.target.id.includes('music')){
		if(!MUSIC_IS_ON){
			
			GAME_MUSIC.loop = true;
			MUSIC_IS_ON = true;	
			GAME_MUSIC.muted = false;
			GAME_MUSIC.play().catch(e => {
				console.error('Audio play failed:', e);
				// Handle the error, possibly by informing the user
			});
			// GAME_MUSIC.play();
		} else {
			GAME_MUSIC.muted = true;
			GAME_MUSIC.loop = false;
			MUSIC_IS_ON = false; 
		}
	}

	// Set up variables that help object clicking in THREE.JS
	let mouse = new THREE.Vector3(0,0,0);
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
	raycaster.setFromCamera(mouse, camera);
	const intersects = raycaster.intersectObjects(scene.children, true); // true for recursive search if needed

	// If something was clicked
	if (intersects.length > 0){
		// If a Mesh has been selected, check if the object is a builder.
		if(INTERSECTED != intersects[0].object && intersects[0].object.type == "Mesh"){
			INTERSECTED = intersects[0].object;
			// If the builder was clicked, make the builder semi transparent and allow it to move around.
			if(INTERSECTED.name.includes("builder")){
				selected_obj = intersects[0].object;
				selected_obj.material.transparent = true;
				selected_obj.material.opacity = 0.5;
				gameManager.builder.isMobile = true;
			// If what's clicked is not a builder, don't allow the builder to move
			} else {
				if(selected_obj != null){
					// Turn off mobility
					selected_obj.material.transparent = false;
					selected_obj.material.opacity = 1;
					gameManager.builder.isMobile = false;
					selected_obj = null;
				}
			}
		}	
	}
}


// Handles all the Right Click actions.
//
//
function onRightClick(event) {
	// Variables for Right Click
	let mouse = new THREE.Vector3(0,0,0);
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
	raycaster.setFromCamera(mouse, camera);
	const intersects = raycaster.intersectObjects(scene.children, true); // true for recursive search if needed

	// If right click happens while the builder isMobile, update a target for the builder to move to.
	if(gameManager.builder.isMobile){
		let intPoint = intersects[0].point;
		let targetPoint = new THREE.Vector3();
		targetPoint.x = intPoint.x;
		targetPoint.z = intPoint.z;
		targetPoint.y = 5;
		gameManager.builder.target.copy(targetPoint);
	}
}


// Setup our scene
function setup() {
	// Init Scene
	scene.background = new THREE.Color(0xffffff);
	renderer.setSize(window.innerWidth, window.innerHeight);
	document.body.appendChild(renderer.domElement);

	// Camera Controls/camera Controls/Camera Controls
	camera.position.set(0, 30, 5);
	orbitControls.saveState();
	camera.position.set(0, 50, 25);
	orbitControls.enablePan = true; 
	orbitControls.enableRotate = false;
	orbitControls.keyPanSpeed = 50;
	orbitControls.maxPolarAngle = Math.PI / 2 -0.2;
	orbitControls.maxDistance = 300;
	orbitControls.minDistance = 20;
	orbitControls.enableDamping = true;
	orbitControls.screenSpacePanning = false;
	orbitControls.maxAzimuthAngle = Math.PI / 2 - 0.5;
	orbitControls.keys = {
		LEFT: 'KeyA',
		RIGHT: 'KeyD',
		UP: 'KeyW',
		BOTTOM: 'KeyS'
	}
	// Camera Position Control by SPACEBAR
	orbitControls.listenToKeyEvents(window);
	window.addEventListener('keydown', function(e) {
		if(e.code === 'Space')
			orbitControls.reset();
	}); 

	//Create Light and color
	scene.background = new THREE.Color(0x011910);
	let directionalLight = new THREE.DirectionalLight(0xffffff, 2);
	let directionalLight2 = new THREE.DirectionalLight(0xffffff, 2);
	directionalLight.position.set(0, 5, 5);
	directionalLight2.position.set(200, 10, -5);
	scene.add(directionalLight);
	scene.add(directionalLight2);

	//Initiate GameManager
		//Given the scene, the game manager generates the gamemap. 
		// Save/Copy the gameMap for main.js to also use.
	gameManager = new GameManager(scene);
	gameManager.init();
	gameMap = gameManager.gameMap;

	// Enable clicking on objects and interactions
	plane = new THREE.Plane(new THREE.Vector3(0, gameMap.tileSize, 0), 0);
	window.addEventListener('contextmenu', onRightClick);
	window.addEventListener('click', onMouseClick);

	// Shows the details of the price, attackpower, range on the button cluster on the bottom right of the html screen
	showPurchaseDetails();

	//First call to animate
	animate();
}


//Set up variable UIupdate to use 
let user_message_timeout;
//Managers error message for the user and upper-right hand info console for the players to see their life, money, time, etc.
function UIupdate(gameManager) {
	// Get appropriate game stats from the gameManager
	let count_down = Math.floor(gameManager.getCountDown()/1000);
	let round = gameManager.getRound();
	let life = gameManager.getPlayerLife();
	let money = gameManager.getPlayerMoney();
	let units = gameManager.getPlayerUnitCount();

	//If player has no life left, stop the music from looping, and change the main game loop (isRunning) to false 
	if(life == 0){
		isRunning = false;
		user_warning_message = "GAME OVER";
		GAME_MUSIC.loop = false;
	}

	if(gameManager.playerWon){
		console.log("you won")
		user_warning_message = "YOU WIN!";
		GAME_MUSIC.loop = false;
	}

	//If the UI's clock shows an invalid time, change it to 0.
	if(count_down == NaN){
		isRunning = false;
		count_down = 0};
	
	// Send information to HTML.   		
	let count_down_string = convertTime(count_down);
	document.getElementById("round").innerHTML = round;
	document.getElementById("count_down").innerHTML = count_down_string;
	document.getElementById("money").innerHTML = money;
	document.getElementById("life").innerHTML = life;
	document.getElementById("units").innerHTML = units;
	document.getElementById("console_log").innerHTML = user_warning_message;

	// Show warning message for 1 second
	if(user_warning_flag_raised){
		user_warning_flag_raised = false;
		clearTimeout(user_message_timeout);
		user_message_timeout = setTimeout(function() {
			user_warning_message = null;
		}, 1000);
	}
}

// Shows the details of the price, attackpower, range on the button cluster on the bottom right of the html screen
function showPurchaseDetails(){
	//Get details from the gameManager as a list.
	let list_of_prices = gameManager.getChampionPriceList();
	let list_of_attack = gameManager.getChampionAttackPowerList();
	let list_of_range = gameManager.getChampionAttackRangeList();
	
	// List of strings you want to show the player, rather than the actual names (like champ 1, champ 10, etc).
	let list_of_champ_names  = ["Rubber Duck","Chicken", "Pigeon", "Duck", "Mallard", "Seagull", "Goose", "Flying Seagull","Canadian Airforce"]

	// HTML holds 3 sub divs for champ details. Loop through all the champions and update those three details
	for(let i = 0; i < list_of_champ_names.length; i++) {
		let champDiv = document.getElementById('champ-' + (i+1));
		let champ_name_Div = champDiv.getElementsByClassName('champ-name')[0]; 
		let t1Div = champDiv.getElementsByClassName('t1')[0]; 
		let t2Div = champDiv.getElementsByClassName('t2')[0]; 
		let t3Div = champDiv.getElementsByClassName('t3')[0]; 
		// Update the text of the t1, t2, and t3 divs of the current champion
		champ_name_Div.textContent = list_of_champ_names[i];
		t1Div.textContent = '🗡️: ' + list_of_attack[i];
		t2Div.textContent = '🎯: ' + list_of_range[i];
		t3Div.textContent = '💵: ' + list_of_prices[i];
	}

}

// Helper function
	// Converting seconds to human readable time 
function convertTime(seconds){
	let minutes = Math.floor(seconds / 60);
	let remainingSeconds = seconds % 60;
	let formattedMinutes = String(minutes).padStart(2, '0');
	let formattedSeconds = String(remainingSeconds).padStart(2, '0');
	let time_string = formattedMinutes + ":" + formattedSeconds;
	return time_string;
}

// animate
function animate() {
	requestAnimationFrame(animate);
	renderer.render(scene, camera);
	// Check game loop
	if(isRunning){
		let deltaTime = clock.getDelta();	
		// Flag gameLoop to stop if gameManager reports that player won
		if(gameManager.playerWon){isRunning = false}
		// Update UI
		UIupdate(gameManager);
		// Update gameManager
		gameManager.update(deltaTime);
	}
	// update camera controls
	orbitControls.update();
}


setup();