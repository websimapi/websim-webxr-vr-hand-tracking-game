import * as THREE from 'three';
import { VRButton } from './modules/VRButton.js';
import { createScene, createCamera, createRenderer, createLights } from './modules/sceneSetup.js';
import { Physics } from './modules/physics.js';
import { createEnvironment } from './modules/environment.js';
import { createGrabbableBlocks } from './modules/objects.js';
import { Player } from './modules/player.js';
import { HandTracking } from './modules/hand-tracking.js';
import { InteractionManager } from './modules/interaction.js';

class Game {
    constructor() {
        this.clock = new THREE.Clock();
        this.physics = new Physics();
        this.grabbableObjects = [];

        this.init();
    }

    init() {
        this.scene = createScene();
        this.camera = createCamera();
        this.renderer = createRenderer();
        document.getElementById('container').appendChild(this.renderer.domElement);

        createLights(this.scene);
        
        document.body.appendChild(VRButton.createButton(this.renderer));

        const { floor, climbableWalls } = createEnvironment(this.scene, this.physics.world);
        const blocks = createGrabbableBlocks(this.scene, this.physics.world);
        this.grabbableObjects.push(...blocks);
        
        this.player = new Player(this.renderer, this.scene, this.physics.world);
        this.handTracking = new HandTracking(this.renderer, this.scene);
        
        this.interactionManager = new InteractionManager({
            renderer: this.renderer,
            scene: this.scene,
            physics: this.physics,
            player: this.player,
            handTracking: this.handTracking,
            grabbableObjects: this.grabbableObjects,
            climbableWalls: climbableWalls
        });

        window.addEventListener('resize', this.onWindowResize.bind(this));

        this.renderer.setAnimationLoop(this.animate.bind(this));
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    animate() {
        const delta = this.clock.getDelta();
        
        // Update order is important
        this.handTracking.update();
        this.interactionManager.update(delta);
        this.player.update(delta);
        this.physics.update(delta);

        // Sync physics bodies with three.js meshes
        this.grabbableObjects.forEach(obj => {
            obj.mesh.position.copy(obj.body.position);
            obj.mesh.quaternion.copy(obj.body.quaternion);
        });

        this.renderer.render(this.scene, this.camera);
    }
}

new Game();

