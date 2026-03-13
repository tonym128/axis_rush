import * as THREE from 'three';
import { textureManager } from './textures.js';

export class Vehicle {
  constructor(scene, type, isPlayer) {
    this.scene = scene;
    this.type = type; // 0: Light, 1: Balanced, 2: Heavy
    this.isPlayer = isPlayer;
    
    const stats = [
      { speed: 300, accel: 150, handling: 3.0 },
      { speed: 350, accel: 120, handling: 2.0 },
      { speed: 400, accel: 90,  handling: 1.0 }
    ];
    
    this.maxSpeed = stats[type].speed;
    this.acceleration = stats[type].accel;
    this.handling = stats[type].handling;
    
    this.speed = 0;
    this.t = 0; 
    this.angle = 0; 
    
    this.isInside = true; 
    this.sideFactor = -1.0; // -1 for inside, 1 for outside
    this.targetSideFactor = -1.0;
    
    this.boostTimer = 0;
    this.lap = 1;
    this.lapProgress = 0; 
    
    this.weapon = null; 
    this.mesh = this.createMesh();
    this.scene.add(this.mesh);
  }
  
  createMesh() {
    const group = new THREE.Group();
    
    let geo;
    if (this.type === 0) {
      geo = new THREE.ConeGeometry(2, 6, 3);
      geo.rotateX(-Math.PI / 2);
    } else if (this.type === 1) {
      geo = new THREE.BoxGeometry(4, 2, 8);
    } else {
      geo = new THREE.CylinderGeometry(2, 4, 8, 4);
      geo.rotateX(-Math.PI / 2);
    }
    
    const colorWord = this.isPlayer ? "blue bright metal shiny" : "orange dirty metal rough";
    const mat = textureManager.getMaterial(colorWord, { flatShading: true });
    const body = new THREE.Mesh(geo, mat);
    body.position.y = 1.5; 
    group.add(body);
    
    const engineGeo = new THREE.PlaneGeometry(3, 3);
    const engineMat = textureManager.getMaterial("cyan neon glowing", { 
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8,
      emissive: new THREE.Color(0x00ffff),
      emissiveIntensity: 1.0
    });
    const engine = new THREE.Mesh(engineGeo, engineMat);
    engine.position.z = -4;
    engine.position.y = 1.5;
    group.add(engine);
    
    return group;
  }
  
  fireWeapon() {
    if (!this.weapon) return;
    this.speed += 50; 
    if (this.isPlayer) {
      document.getElementById('weapon-display').innerText = `WEAPON: NONE`;
    }
    this.weapon = null;
  }

  update(dt, track, inputs) {
    if (this.boostTimer > 0) {
      this.boostTimer -= dt;
      this.maxSpeed = 500;
    } else {
      const stats = [
        { speed: 300, accel: 150, handling: 3.0 },
        { speed: 350, accel: 120, handling: 2.0 },
        { speed: 400, accel: 90,  handling: 1.0 }
      ];
      this.maxSpeed = stats[this.type].speed;
    }
    
    if (inputs.accelerate) {
      this.speed += this.acceleration * dt;
    } else if (inputs.brake) {
      this.speed -= this.acceleration * 1.5 * dt;
    } else {
      this.speed -= this.acceleration * 0.5 * dt; 
    }
    
    this.speed = Math.max(0, Math.min(this.speed, this.maxSpeed));
    
    // Swapped steering as requested
    if (inputs.left) {
      this.angle += this.handling * dt;
    }
    if (inputs.right) {
      this.angle -= this.handling * dt;
    }
    
    if (inputs.switch) {
      this.isInside = !this.isInside;
      this.targetSideFactor = this.isInside ? -1.0 : 1.0;
      inputs.switch = false; 
    }

    // Animate side transition
    const transitionSpeed = 4.0;
    if (this.sideFactor < this.targetSideFactor) {
      this.sideFactor = Math.min(this.targetSideFactor, this.sideFactor + dt * transitionSpeed);
    } else if (this.sideFactor > this.targetSideFactor) {
      this.sideFactor = Math.max(this.targetSideFactor, this.sideFactor - dt * transitionSpeed);
    }
    
    if (inputs.fire && this.weapon) {
      this.fireWeapon();
      inputs.fire = false;
    }
    
    if (this.angle < 0) this.angle += Math.PI * 2;
    if (this.angle > Math.PI * 2) this.angle -= Math.PI * 2;
    
    const trackLength = 12000; 
    const deltaT = (this.speed * dt) / trackLength;
    this.t += deltaT;
    this.lapProgress += deltaT;
    
    if (this.t >= 1.0) {
      this.t -= 1.0;
      this.lap++;
    }
    
    const frame = track.getFrameAt(this.t);
    const crossNormal = new THREE.Vector3().copy(frame.normal).applyAxisAngle(frame.tangent, this.angle);
    
    // Smooth radius transition
    // Inside: factor -1 -> r = 18
    // Outside: factor 1 -> r = 22
    let r = track.radius + (this.sideFactor * 2.0);
    
    const pos = new THREE.Vector3().copy(frame.point);
    pos.add(crossNormal.clone().multiplyScalar(r));
    
    this.mesh.position.copy(pos);
    
    // Smoothly flip up vector
    const up = crossNormal.clone().multiplyScalar(this.sideFactor);
    this.mesh.up.copy(up);
    this.mesh.lookAt(pos.clone().add(frame.tangent));
    
    // Add flip rotation to children
    // If factor is -1, rotation is 0. If factor is 1, rotation is PI.
    this.mesh.children[0].rotation.z = (this.sideFactor + 1.0) * (Math.PI / 2.0);
    
    this.checkCollisions(track);
  }
  
  checkCollisions(track) {
    for (const item of track.items) {
      if (!item.active) continue;
      
      const tDiff = Math.abs(this.t - item.t);
      if (tDiff > 0.005 && tDiff < 0.995) continue; 
      
      // Use targetSideFactor to avoid picking items during transition if preferred,
      // but here we check against actual current side for better collision.
      const currentIsInside = this.sideFactor < 0;
      if (currentIsInside !== item.isInside) continue;
      
      let angleDiff = Math.abs(this.angle - item.angle);
      if (angleDiff > Math.PI) angleDiff = Math.PI * 2 - angleDiff;
      
      if (angleDiff < 0.2) {
        item.active = false;
        item.mesh.visible = false;
        item.cooldown = 5.0; 
        
        if (item.type === 'boost') {
          this.speed += 100;
          this.boostTimer = 1.0;
        } else if (item.type === 'weapon') {
          const weapons = ['missile', 'oil', 'barrel'];
          this.weapon = weapons[Math.floor(Math.random() * weapons.length)];
        }
      }
    }
  }
}

export class AI extends Vehicle {
  constructor(scene, difficulty) {
    super(scene, Math.floor(Math.random() * 3), false);
    this.difficulty = difficulty; 
    
    this.t = Math.random() * 0.05;
    this.angle = Math.random() * Math.PI * 2;
    this.lapProgress = this.t;
    this.targetAngle = this.angle;
    this.reactionTimer = 0;
  }
  
  update(dt, track, player) {
    this.reactionTimer -= dt;
    if (this.reactionTimer <= 0) {
      this.reactionTimer = 0.5 - this.difficulty * 0.1;
      
      let nearestPad = null;
      let minDist = 0.05; 
      
      for (const item of track.items) {
        if (!item.active || item.type !== 'boost') continue;
        if (item.isInside !== this.isInside) continue;
        
        let dist = item.t - this.t;
        if (dist < 0) dist += 1.0;
        
        if (dist > 0 && dist < minDist) {
          nearestPad = item;
          minDist = dist;
        }
      }
      
      if (nearestPad) {
        this.targetAngle = nearestPad.angle;
      }
      
      if (this.weapon && Math.random() > 0.8) {
        this.fireWeapon();
      }

      // Randomly switch sides
      if (Math.random() > 0.95) {
        this.isInside = !this.isInside;
        this.targetSideFactor = this.isInside ? -1.0 : 1.0;
      }
    }
    
    const inputs = {
      accelerate: true,
      brake: false,
      left: false,
      right: false,
      switch: false,
      fire: false
    };
    
    const distToPlayer = this.lapProgress - player.lapProgress;
    const diffMult = [0.85, 0.95, 1.05][this.difficulty];
    
    if (distToPlayer > 0.05) {
      inputs.accelerate = Math.random() > 0.2;
    } else if (distToPlayer < -0.05) {
      this.speed += 5 * dt; 
    }
    
    let angleDiff = this.targetAngle - this.angle;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
    
    if (angleDiff > 0.1) inputs.right = true;
    if (angleDiff < -0.1) inputs.left = true;
    
    super.update(dt * diffMult, track, inputs);
  }
}
