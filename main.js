import * as THREE from 'three';
import { textureManager } from './textures.js';
import { audioEngine } from './audio.js';
import { Track } from './track.js';
import { Vehicle, AI } from './vehicle.js';

class Game {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: false 
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x000000);
    
    this.camera = new THREE.PerspectiveCamera(85, window.innerWidth / window.innerHeight, 0.1, 10000);
    
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);
    
    const sunLight = new THREE.DirectionalLight(0xffffff, 1);
    sunLight.position.set(100, 100, 50);
    this.scene.add(sunLight);
    
    this.state = 'MENU'; 
    this.mapType = 0;
    this.difficulty = 0;
    this.vehicleType = 0;
    
    this.player = null;
    this.ais = [];
    this.track = null;
    this.clock = new THREE.Clock();
    
    this.inputs = {
      accelerate: false,
      brake: false,
      left: false,
      right: false,
      switch: false,
      fire: false
    };
    
    this.setupUI();
    this.setupInputs();
    
    window.addEventListener('resize', () => this.onResize());
    
    this.loop();
  }
  
  setupUI() {
    const startBtn = document.getElementById('start-btn');
    const restartBtn = document.getElementById('restart-btn');
    
    const setupGroup = (id, callback) => {
      const btns = document.querySelectorAll(`#${id} button`);
      btns.forEach(btn => {
        btn.addEventListener('click', () => {
          btns.forEach(b => b.classList.remove('selected'));
          btn.classList.add('selected');
          callback(parseInt(btn.dataset.val));
        });
      });
    };
    
    setupGroup('vehicle-select', val => this.vehicleType = val);
    setupGroup('map-select', val => this.mapType = val);
    setupGroup('diff-select', val => this.difficulty = val);
    
    startBtn.addEventListener('click', () => this.startRace());
    restartBtn.addEventListener('click', () => this.showMenu());
  }
  
  setupInputs() {
    window.addEventListener('keydown', (e) => {
      if (this.state !== 'RACING') return;
      if (e.code === 'ArrowUp' || e.code === 'KeyW') this.inputs.accelerate = true;
      if (e.code === 'ArrowDown' || e.code === 'KeyS') this.inputs.brake = true;
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.inputs.left = true;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') this.inputs.right = true;
      if (e.code === 'Space') this.inputs.switch = true;
      if (e.code === 'KeyQ') this.inputs.fire = true;
    });
    
    window.addEventListener('keyup', (e) => {
      if (e.code === 'ArrowUp' || e.code === 'KeyW') this.inputs.accelerate = false;
      if (e.code === 'ArrowDown' || e.code === 'KeyS') this.inputs.brake = false;
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') this.inputs.left = false;
      if (e.code === 'ArrowRight' || e.code === 'KeyD') this.inputs.right = false;
      if (e.code === 'KeyQ') this.inputs.fire = false;
    });
  }
  
  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
  
  showMenu() {
    this.state = 'MENU';
    document.getElementById('main-menu').classList.add('active');
    document.getElementById('hud').classList.remove('active');
    document.getElementById('game-over').classList.remove('active');
    audioEngine.stop();
    
    while(this.scene.children.length > 0){ 
        this.scene.remove(this.scene.children[0]); 
    }
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambientLight);
    const sunLight = new THREE.DirectionalLight(0xffffff, 1);
    sunLight.position.set(100, 100, 50);
    this.scene.add(sunLight);
  }
  
  startRace() {
    this.state = 'STARTING';
    document.getElementById('main-menu').classList.remove('active');
    document.getElementById('hud').classList.add('active');
    
    this.track = new Track(this.scene, this.mapType);
    this.player = new Vehicle(this.scene, this.vehicleType, true);
    
    this.ais = [];
    for (let i = 0; i < 8; i++) {
      this.ais.push(new AI(this.scene, this.difficulty));
    }
    
    // Skybox
    const skyGeo = new THREE.SphereGeometry(5000, 32, 32);
    const skyMat = textureManager.getMaterial("purple dark stars void", { 
      side: THREE.BackSide,
      fog: false
    });
    const sky = new THREE.Mesh(skyGeo, skyMat);
    this.scene.add(sky);
    
    audioEngine.setIntensity(this.difficulty);
    audioEngine.start();
    
    this.countdown();
  }
  
  async countdown() {
    const msg = document.getElementById('message-display');
    msg.innerText = "3";
    await new Promise(r => setTimeout(r, 1000));
    msg.innerText = "2";
    await new Promise(r => setTimeout(r, 1000));
    msg.innerText = "1";
    await new Promise(r => setTimeout(r, 1000));
    msg.innerText = "GO!";
    this.state = 'RACING';
    setTimeout(() => msg.innerText = "", 1000);
  }
  
  updateHUD() {
    if (!this.player) return;
    
    const allRacers = [this.player, ...this.ais];
    allRacers.sort((a, b) => b.lapProgress - a.lapProgress);
    const rank = allRacers.indexOf(this.player) + 1;
    
    document.getElementById('pos-display').innerText = `POS: ${rank}/9`;
    document.getElementById('lap-display').innerText = `LAP: ${this.player.lap}/3`;
    document.getElementById('speed-display').innerText = `SPEED: ${Math.floor(this.player.speed)} KM/H`;
    document.getElementById('weapon-display').innerText = `WEAPON: ${this.player.weapon || 'NONE'}`;
    
    if (this.player.lap > 3) {
      this.finishRace(rank);
    }
  }
  
  finishRace(rank) {
    this.state = 'FINISHED';
    document.getElementById('game-over').classList.add('active');
    document.getElementById('go-title').innerText = rank === 1 ? "VICTORY!" : "RACE FINISHED";
    document.getElementById('go-stats').innerText = `YOU FINISHED IN POSITION #${rank}`;
  }
  
  update(dt) {
    if (this.state === 'RACING' || this.state === 'FINISHED') {
      this.track.update(dt);
      
      if (this.state === 'RACING') {
        this.player.update(dt, this.track, this.inputs);
        for (const ai of this.ais) {
          ai.update(dt, this.track, this.player);
        }
      } else {
        this.player.update(dt, this.track, { accelerate: false, brake: true });
      }
      
      // Better Camera Follow
      const playerPos = this.player.mesh.position;
      
      // Use a smaller T offset for closer following
      const camFrame = this.track.getFrameAt(this.player.t - 0.015); 
      const camPos = new THREE.Vector3().copy(camFrame.point);
      
      // Use the player's sideFactor for the camera too
      const camNormal = new THREE.Vector3().copy(camFrame.normal).applyAxisAngle(camFrame.tangent, this.player.angle);
      
      // Camera distance from surface: further away than the player
      // Player is at track.radius + (sideFactor * 2)
      // Camera should be at track.radius + (sideFactor * 10) for inside-out feel
      let camR = this.track.radius + (this.player.sideFactor * 12);
      camPos.add(camNormal.multiplyScalar(camR));
      
      this.camera.position.lerp(camPos, 0.1);
      this.camera.up.lerp(this.player.mesh.up, 0.1);
      
      // Look at a target slightly ahead of the player
      const lookFrame = this.track.getFrameAt(this.player.t + 0.02);
      const lookPos = new THREE.Vector3().copy(lookFrame.point);
      const lookNormal = new THREE.Vector3().copy(lookFrame.normal).applyAxisAngle(lookFrame.tangent, this.player.angle);
      let lookR = this.track.radius + (this.player.sideFactor * 2);
      lookPos.add(lookNormal.multiplyScalar(lookR));
      
      this.camera.lookAt(lookPos);
      
      this.updateHUD();
    } else if (this.state === 'MENU') {
      const time = performance.now() * 0.0005;
      this.camera.position.set(Math.sin(time) * 100, 50, Math.cos(time) * 100);
      this.camera.lookAt(0,0,0);
    }
  }
  
  loop() {
    const dt = this.clock.getDelta();
    this.update(Math.min(dt, 0.1)); 
    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(() => this.loop());
  }
}

new Game();
