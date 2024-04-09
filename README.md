# tower-defense

This is a game that was developed for the individual final project in COMP4303 in Memorial University of Newfoundland. The main technologies used for this project were Javascript, Blender, THREE.js, HTML/CSS, and Davincci Resolve. 

This game was inspired by the SOLDIER TOWER DEFENSE game, which is a custom game created by fans of WarCraft3.


## Table of Content
- [How-to-run]
- [How-to-play]
- [Algorithms-used]
- [Attributions]

## How-to-run
    - Run npx vite and play.

## How-to-play    
    - Camera Controls
        - WASD:         move camera in the x-z axis
        - SPACE:        move camera to the center of the map where camera = "camera.position.set(0, 30, 5);"
        - SCROLL WHEEL: Zoom In-Out
    - Other Controls 
        - MUSIC ICON:       Located in the bottom-left, this button turns on/off music.
        - PAUSE ICON:       Located in the bottom-left, this button pauses the game.
        - SKIP ROUND ICON:  Located in the bottom-left, this button allows the player to skip to the next round.

    - Goal
        - Your goal is to survive 7 waves of monsters.
        - You have 10 lives. If you reach 0 lives, it's game over.

    - Builder(blue/white duck)
        - The builder has an attack power of 1. It is the only unit that can attack anywhere on the map.
        - Left Click on the duck to control the duck. When clicked, it cannot attack.
        - Left Click anywere but the duck to de-select.
        - Right Click to command the duck to go to the clicked area.
    - Champion:
        - There are 9 champions.
        - To purchase/build a champion, the builder must be standing on a valid tile (type.GROUND)
        - The price, power, and range are shown in the console in the bottom-right.
        - Click the black button on the bottom-right console to build a champion.
    - Mob:
        - There are 7 waves of mobs and 2 types of bonus mobs.
        - 1. Wave mobs:
            This mob follows the only path in the game.
            Kill them to get money.
            For each one to reach the end of the path has the player lose 1 heart.
            There are 7 waves, and each wave has a different model and HP.
        - 2. Bonus mob (Loot Box):
            This mob has no eyes. It will wander around the map. Kill it to find out what's inside.
            This mob resides on the field and can go anywhere.
        - 3. Bonus mob (Mouse):
            This mob will run away if you attack it. It will give you a fair amount of money.
            This mob resides on the field and can go anywhere.



## Algorithms-used
    - .Algorithms successfully implemented based on Project instructions:
        - Complex Movement Algorithm:       Wandering (Random loot box and mouse on the field)
        - Pathfinding:                      A* (mouse on the field)
        - Decision Making:                  State Machine (All the non-static objects on the map)
        - Procedural Content Generation:    Pseudorandom Number Generation LCG (Canadian Geese attack power fluctuation)



## Attributions 
    - How to set color in THREE.JS
        https://discourse.threejs.org/t/set-color-to-object/19321/2

    - How to correctly click an object in THREE.JS
        https://www.youtube.com/watch?v=By9qRmcrTzs&list=LL&index=68

    - How to manipulate clicked object in THREE.JS
        https://www.youtube.com/watch?v=a0qSHBnqORU&t=423s

    - Blender Basics
        https://www.youtube.com/watch?v=YQaL4DZ8UCs&list=PLu6D0dxL_wefKBJdZ7oJ3Wsc2pRtWDOeU&index=5

    - 3D objects courtesy of:
        Mouse 3D object: r4gnarius at turbosquid.com
        Mystery Box 3D object: freidrich at turbosquid.com
        Dragon 3D object: Sajid Diaz Art3d
        Rubber Duck 3D object: Tatiana_Gladkaya
        Yoshi 3D object: YellowFox56
        Red Diavoletto 3D object: GionaGiona
        Borderland Robot 3D object: iamcyberalex
        Articulated Worm 3D object: My Asset
        Orc2 3D object: Dzimge

    - .js classes not made by myself, but rather written by Dr. Henderson, Jay. These js classes are:
        - Graph.js
        - TileNode.js
        - PriorityQueue.js
        - Pseudorandom.js
        - Resources.js
        - VectorUtil.js

    - .js classes made by Dr. Henderson, but significantly modified by myself:
        - GameMap.js
        - LSystem.js

