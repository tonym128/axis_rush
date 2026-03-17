import * as THREE from 'three';
import { textureManager } from './textures.js';
import { VEHICLE_BASE_STATS } from './constants.js';
import { audioEngine } from './audio.js';

export class Vehicle {
  constructor(scene, type, isPlayer, pilot = { id: -1, name: "UNKNOWN", color: new THREE.Color(0xffffff) }, upgrades = { speed: 0, handling: 0, armor: 0 }) {
    this.scene = scene;
    this.type = type; 
    this.isPlayer = isPlayer;
    this.isHuman = isPlayer; // Default to isPlayer, can be overridden for remote humans
    this.pilot = pilot;
    
    const stats = VEHICLE_BASE_STATS[type];
    
    this.maxSpeed = stats.speed + (upgrades.speed * 25);
    this.acceleration = stats.accel + (upgrades.speed * 15);
    this.handling = stats.handling + (upgrades.handling * 0.4);
    
    this.speed = 0;
    this.t = 0; 
    this.angle = 0; 
    this.angularVelocity = 0; 
    
    this.isInside = true; 
    this.sideFactor = -1.0; 
    this.targetSideFactor = -1.0;
    
    this.boostTimer = 0;
    this.bonusSpeed = 0; 
    this.shakeAmount = 0; 
    this.cameraShakeRequest = 0; 
    
    this.lap = 1;
    this.lapProgress = 0; 
    this.lapTimes = [];
    this.totalTime = 0;
    this.rank = 0; 
    this.maxEnergy = stats.armor + (upgrades.armor * 25);
    this.energy = this.maxEnergy; 
    this.isExploded = false;
    this.respawnTimer = 0;
    this.flashTimer = 0; 
    this.invulnerableTimer = 0;
    this.rivalries = {}; 
    
    this.weapon = null; 
    this.mesh = this.createMesh();
    this.scene.add(this.mesh);

    this.rankLabel = this.createRankLabel();
    this.scene.add(this.rankLabel);

    this.numberLabel = this.createNumberLabel();
    this.scene.add(this.numberLabel);

    this.trailHistory = [];
    this.maxTrailPoints = 40;
    this.trailMesh = this.createTrailMesh();
    this.scene.add(this.trailMesh);

    this.slipstreamActive = false;
    this.slipstreamMesh = this.createSlipstreamMesh();
    this.scene.add(this.slipstreamMesh);

    this.blurLines = this.createBlurLines();
    this.scene.add(this.blurLines);

    this.minimapMarker = this.createMinimapMarker();
    this.scene.add(this.minimapMarker);
  }
  
  createRankLabel() {
    const canvas = document.createElement('canvas'); canvas.width = 64; canvas.height = 64;
    const ctx = canvas.getContext('2d'); const texture = new THREE.CanvasTexture(canvas);
    const mat = new THREE.SpriteMaterial({ map: texture, transparent: true, opacity: 0.4, depthTest: false });
    const sprite = new THREE.Sprite(mat); sprite.scale.set(10, 10, 1);
    sprite._ctx = ctx; sprite._tex = texture;
    return sprite;
  }

  createNumberLabel() {
    const canvas = document.createElement('canvas'); canvas.width = 64; canvas.height = 64;
    const ctx = canvas.getContext('2d'); const texture = new THREE.CanvasTexture(canvas);
    const mat = new THREE.SpriteMaterial({ map: texture, transparent: true, opacity: 0.3, depthTest: false });
    const sprite = new THREE.Sprite(mat); sprite.scale.set(6, 6, 1);
    ctx.font = 'bold 40px Courier New'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = this.isPlayer ? '#ffff00' : '#ffffff'; ctx.fillText(`${this.pilot.id + 1}`, 32, 32);
    texture.needsUpdate = true; return sprite;
  }

  updateRankLabel() {
    const ctx = this.rankLabel._ctx; const tex = this.rankLabel._tex;
    ctx.clearRect(0, 0, 64, 64); ctx.font = 'bold 48px Courier New'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = this.isPlayer ? '#ffff00' : '#ffffff'; ctx.strokeStyle = '#000000'; ctx.lineWidth = 4;
    ctx.strokeText(this.rank, 32, 32); ctx.fillText(this.rank, 32, 32); tex.needsUpdate = true;
  }

  createMesh() {
    const group = new THREE.Group();
    const colorWord = this.isPlayer ? "silver metal shiny" : "metal shiny";
    const matOptions = { flatShading: true, metalness: 0.9, roughness: 0.2 };
    if (!this.isPlayer) matOptions.color = this.pilot.color;
    const mat = textureManager.getMaterial(colorWord, matOptions);
    
    // Add glowing accent material based on pilot color
    const accentColor = this.isPlayer ? 0x00ffff : this.pilot.color.getHex();
    const glowMat = new THREE.MeshStandardMaterial({ 
      color: accentColor, emissive: accentColor, emissiveIntensity: 2.0, metalness: 0.8, roughness: 0.2
    });
    const darkMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.9, roughness: 0.5 });

    if (this.type === 0) { 
      // LIGHT CLASS: Sleek, agile, forward-swept wings (Needle shape)
      const core = new THREE.Mesh(new THREE.ConeGeometry(1.5, 8, 4), mat);
      core.rotateX(-Math.PI / 2); core.position.z = -1;
      const wingG = new THREE.BoxGeometry(6, 0.5, 2);
      const wings = new THREE.Mesh(wingG, mat);
      wings.position.set(0, -0.5, 1);
      const engine1 = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.8, 3, 8), darkMat);
      engine1.rotateX(Math.PI / 2); engine1.position.set(-1.5, 0, 3);
      const engine2 = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.8, 3, 8), darkMat);
      engine2.rotateX(Math.PI / 2); engine2.position.set(1.5, 0, 3);
      const cockpit = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1, 3), darkMat);
      cockpit.position.set(0, 0.8, -1);
      const accent = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.2, 4), glowMat);
      accent.position.set(0, 0.5, -1);
      group.add(core, wings, engine1, engine2, cockpit, accent);
    }
    else if (this.type === 1) { 
      // BALANCED CLASS: Twin-hull Interceptor
      const hullL = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 7), mat);
      hullL.position.x = -1.5;
      const hullR = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 7), mat);
      hullR.position.x = 1.5;
      const bridge = new THREE.Mesh(new THREE.BoxGeometry(2, 0.6, 2), darkMat);
      bridge.position.set(0, 0, 0);
      const cockpit = new THREE.Mesh(new THREE.SphereGeometry(1, 8, 8), darkMat);
      cockpit.scale.set(1, 0.6, 1.5); cockpit.position.set(0, 0.5, -0.5);
      const wingL = new THREE.Mesh(new THREE.BoxGeometry(2, 0.2, 3), mat);
      wingL.position.set(-2.5, 0, 1); wingL.rotation.z = 0.4;
      const wingR = new THREE.Mesh(new THREE.BoxGeometry(2, 0.2, 3), mat);
      wingR.position.set(2.5, 0, 1); wingR.rotation.z = -0.4;
      const glowL = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 5), glowMat);
      glowL.position.set(-1.5, 0.5, 0);
      const glowR = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 5), glowMat);
      glowR.position.set(1.5, 0.5, 0);
      group.add(hullL, hullR, bridge, cockpit, wingL, wingR, glowL, glowR);
    }
    else { 
      // HEAVY CLASS: Brutalist, blocky, twin massive engines
      const core = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.4, 7), mat); // Slightly smaller to avoid engine overlap
      const eLeft = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 6, 8), darkMat);
      eLeft.rotateX(Math.PI / 2); eLeft.position.set(-2.5, 0, 0.5);
      const eRight = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 6, 8), darkMat);
      eRight.rotateX(Math.PI / 2); eRight.position.set(2.5, 0, 0.5);
      const plate1 = new THREE.Mesh(new THREE.BoxGeometry(8, 0.5, 2), mat);
      plate1.position.set(0, 1.55, -1); // Offset to avoid z-fighting with core
      const armorG = new THREE.BoxGeometry(3, 3, 2);
      const armorFront = new THREE.Mesh(armorG, darkMat);
      armorFront.position.set(0, 0, -3.5);
      const glow1 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 6), glowMat);
      glow1.position.set(-2.5, 1.55, 0.5);
      const glow2 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 6), glowMat);
      glow2.position.set(2.5, 1.55, 0.5);
      group.add(core, eLeft, eRight, plate1, armorFront, glow1, glow2);
    }
    
    group.position.y = 1.5;
    if (this.isPlayer) { const pLight = new THREE.PointLight(0xffffff, 0.5, 20); pLight.position.set(0, 5, 5); group.add(pLight); }
    
    return group;
  }

  createTrailMesh() {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(this.maxTrailPoints * 2 * 3); 
    const indices = [];
    for (let i = 0; i < this.maxTrailPoints - 1; i++) {
      const a = i * 2, b = i * 2 + 1, c = (i + 1) * 2, d = (i + 1) * 2 + 1;
      indices.push(a, b, c, b, d, c);
    }
    geo.setIndex(indices);
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.MeshBasicMaterial({
      color: this.isPlayer ? 0x00ffff : this.pilot.color.getHex(), 
      transparent: true, opacity: 0.7, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false
    });
    const mesh = new THREE.Mesh(geo, mat); mesh.frustumCulled = false; return mesh;
  }

  createSlipstreamMesh() {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(6 * 3); 
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8, depthWrite: false, blending: THREE.AdditiveBlending });
    const lines = new THREE.LineSegments(geo, mat); lines.frustumCulled = false; return lines;
  }

  createBlurLines() {
    const count = 20;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 2 * 3);
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending, depthWrite: false });
    const lines = new THREE.LineSegments(geo, mat); lines.frustumCulled = false; return lines;
  }

  createMinimapMarker() {
    const geo = new THREE.SphereGeometry(45, 16, 16); 
    const mat = new THREE.MeshBasicMaterial({ color: this.isPlayer ? 0xffffff : this.pilot.color, depthTest: false, transparent: true, opacity: 0.9 });
    const mesh = new THREE.Mesh(geo, mat); return mesh;
  }
  
  fireWeapon(spawnProjectile) {
    if (!this.weapon) return;
    if (this.isPlayer) audioEngine.playShoot();
    if (spawnProjectile) spawnProjectile(this.weapon, this);
    else this.speed += 50; 
    if (this.isPlayer) document.getElementById('weapon-display').innerText = `WEAPON: NONE`;
    this.weapon = null;
  }

  takeDamage(amount, attacker = null, otherRacers = []) {
    if (this.isExploded || this.invulnerableTimer > 0) return;
    if (this.isPlayer) audioEngine.playHit();
    this.energy -= amount; this.flashTimer = 0.5;
    this.invulnerableTimer = 1.0;
    if (this.isPlayer) {
      this.cameraShakeRequest = amount * 0.05;
      // Push others away
      for (const other of otherRacers) {
        if (other === this || other.isExploded) continue;
        const distT = Math.abs(this.lapProgress - other.lapProgress);
        if (distT < 0.02) {
          let angleDiff = other.angle - this.angle;
          while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
          while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
          const pushDir = angleDiff > 0 ? 1 : -1;
          other.angle += pushDir * 0.5;
          other.speed *= 0.8;
          other.shakeAmount = 1.0;
        }
      }
    } else if (attacker && attacker.isPlayer) {
      // AI was hit by player
      if (window.gameInstance) window.gameInstance.showComms(this.pilot, 'onHit');
    }
    if (attacker && attacker !== this) { const id = attacker.pilot.id; this.rivalries[id] = (this.rivalries[id] || 0) + 1; }
  }

  flashShield(dt) {
    if (this.flashTimer > 0) {
      this.flashTimer -= dt; const intensity = Math.sin(this.flashTimer * 40) * 0.5 + 0.5;
      this.mesh.children[0].material.emissive.set(this.isPlayer ? 0xffffff : 0xff0000);
      this.mesh.children[0].material.emissiveIntensity = intensity * 2.0;
    } else { this.mesh.children[0].material.emissiveIntensity = 0; }
  }

  updateInvulnerability(dt) {
    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer -= dt;
      // Flickering effect
      const blink = Math.sin(performance.now() * 0.05) > 0;
      this.mesh.visible = blink;
    } else {
      if (!this.isExploded) this.mesh.visible = true;
    }
  }

  updateTrail() {
    const enginePos = new THREE.Vector3().copy(this.mesh.position);
    const left = new THREE.Vector3(-1, 0, 0).applyQuaternion(this.mesh.quaternion);
    const width = 1.2;
    const p1 = enginePos.clone().add(left.clone().multiplyScalar(width));
    const p2 = enginePos.clone().add(left.clone().multiplyScalar(-width));
    this.trailHistory.unshift({ p1, p2 });
    if (this.trailHistory.length > this.maxTrailPoints) this.trailHistory.pop();
    const positions = this.trailMesh.geometry.attributes.position.array;
    for (let i = 0; i < this.trailHistory.length; i++) {
      const entry = this.trailHistory[i];
      positions[i * 6 + 0] = entry.p1.x; positions[i * 6 + 1] = entry.p1.y; positions[i * 6 + 2] = entry.p1.z;
      positions[i * 6 + 3] = entry.p2.x; positions[i * 6 + 4] = entry.p2.y; positions[i * 6 + 5] = entry.p2.z;
    }
    this.trailMesh.geometry.attributes.position.needsUpdate = true;
    this.trailMesh.material.opacity = (this.speed / 400) * 0.7;
  }

  updateSlipstream(otherRacers) {
    this.slipstreamActive = false; let targetRacer = null;
    for (const other of otherRacers) {
      if (other === this || other.isExploded) continue;
      if ((other.sideFactor > 0) !== (this.sideFactor > 0)) continue;
      let tDiff = other.lapProgress - this.lapProgress;
      if (tDiff > 0 && tDiff < 0.015) {
        let angleDiff = Math.abs(this.angle - other.angle);
        if (angleDiff > Math.PI) angleDiff = Math.PI * 2 - angleDiff;
        if (angleDiff < 0.3) { this.slipstreamActive = true; targetRacer = other; break; }
      }
    }
    if (this.slipstreamActive && targetRacer) {
      this.slipstreamMesh.visible = true; const positions = this.slipstreamMesh.geometry.attributes.position.array;
      const start = this.mesh.position, end = targetRacer.mesh.position;
      for (let i = 0; i < 3; i++) {
        const offset = new THREE.Vector3(Math.random()-0.5, Math.random()-0.5, Math.random()-0.5).multiplyScalar(1.5);
        positions[i * 6 + 0] = start.x + offset.x; positions[i * 6 + 1] = start.y + offset.y; positions[i * 6 + 2] = start.z + offset.z;
        positions[i * 6 + 3] = end.x + offset.x; positions[i * 6 + 4] = end.y + offset.y; positions[i * 6 + 5] = end.z + offset.z;
      }
      this.slipstreamMesh.geometry.attributes.position.needsUpdate = true;
    } else { this.slipstreamMesh.visible = false; }
  }

  updateBlurLines() {
    if (!this.isPlayer) { this.blurLines.visible = false; return; }
    const speedFactor = Math.max(0, (this.speed - 200) / 300);
    if (speedFactor <= 0) { this.blurLines.visible = false; return; }
    this.blurLines.visible = true; this.blurLines.material.opacity = speedFactor * 0.4;
    const positions = this.blurLines.geometry.attributes.position.array;
    const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(this.mesh.quaternion);
    const pos = this.mesh.position;
    for (let i = 0; i < 20; i++) {
      const offset = new THREE.Vector3((Math.random() - 0.5) * 40, (Math.random() - 0.5) * 40, (Math.random() - 0.5) * 40);
      const start = pos.clone().add(offset); const length = 5 + speedFactor * 20;
      const end = start.clone().add(forward.clone().multiplyScalar(-length));
      positions[i * 6 + 0] = start.x; positions[i * 6 + 1] = start.y; positions[i * 6 + 2] = start.z;
      positions[i * 6 + 3] = end.x; positions[i * 6 + 4] = end.y; positions[i * 6 + 5] = end.z;
    }
    this.blurLines.geometry.attributes.position.needsUpdate = true;
  }

  update(dt, track, inputs, otherRacers = [], spawnProjectile = null) {
    if (this.isExploded) {
      this.respawnTimer -= dt;
      if (this.respawnTimer <= 0) {
        this.isExploded = false; this.energy = 50; this.speed = 0;
        this.invulnerableTimer = 5.0; // Long recovery for deaths
        this.mesh.visible = true; 
        if (this.trailMesh.visible !== false) this.trailMesh.visible = true;
        if (this.minimapMarker.visible !== false) this.minimapMarker.visible = true;
        if (this.rankLabel.visible !== false) this.rankLabel.visible = true;
        if (this.numberLabel.visible !== false) this.numberLabel.visible = true;
      }
      return;
    }

    this.updateSlipstream(otherRacers);
    if (this.bonusSpeed > 0) { this.bonusSpeed -= 75 * dt; if (this.bonusSpeed < 0) this.bonusSpeed = 0; }
    if (this.lap > 1 && inputs.boost && this.energy > 5) { this.energy -= 20 * dt; this.bonusSpeed = Math.max(this.bonusSpeed, 150); }
    let currentMaxSpeed = this.maxSpeed + this.bonusSpeed; if (this.slipstreamActive) currentMaxSpeed *= 1.2; 
    
    if (dt > 0) {
      if (inputs.accelerate) this.speed += this.acceleration * dt; else if (inputs.brake) this.speed -= this.acceleration * 1.5 * dt; else this.speed -= this.acceleration * 0.5 * dt; 
      this.speed = Math.max(0, Math.min(this.speed, currentMaxSpeed)); if (inputs.left || inputs.right) this.speed -= this.speed * 0.02 * dt;
      const steeringAccel = this.handling * 10.0, steeringFriction = 4.0;
      if (inputs.left) this.angularVelocity -= steeringAccel * dt; else if (inputs.right) this.angularVelocity += steeringAccel * dt; else this.angularVelocity -= this.angularVelocity * steeringFriction * dt;
      const maxAngVel = 2.0; this.angularVelocity = Math.max(-maxAngVel, Math.min(maxAngVel, this.angularVelocity));
      const sideMultiplier = this.sideFactor < 0 ? -1.0 : 1.0; this.angle += this.angularVelocity * sideMultiplier * dt;
      if (inputs.switch) { this.isInside = !this.isInside; this.targetSideFactor = this.isInside ? -1.0 : 1.0; inputs.switch = false; }
      const transitionSpeed = 4.0; if (this.sideFactor < this.targetSideFactor) this.sideFactor = Math.min(this.targetSideFactor, this.sideFactor + dt * transitionSpeed); else if (this.sideFactor > this.targetSideFactor) this.sideFactor = Math.max(this.targetSideFactor, this.sideFactor - dt * transitionSpeed);
      if (inputs.fire && this.weapon) { this.fireWeapon(spawnProjectile); inputs.fire = false; }
      if (this.angle < 0) this.angle += Math.PI * 2; if (this.angle > Math.PI * 2) this.angle -= Math.PI * 2;
      const trackLength = 12000; const deltaT = (this.speed * dt) / trackLength; this.t += deltaT; this.lapProgress += deltaT; if (this.t >= 1.0) { this.t -= 1.0; this.lap++; }
    }

    const frame = track.getFrameAt(this.t); const crossNormal = new THREE.Vector3().copy(frame.normal).applyAxisAngle(frame.tangent, this.angle);
    let r = track.radius + (this.sideFactor * 2.0); const pos = new THREE.Vector3().copy(frame.point); pos.add(crossNormal.clone().multiplyScalar(r));
    if (this.shakeAmount > 0) { this.shakeAmount -= dt * 2.0; const shakeOffset = new THREE.Vector3((Math.random() - 0.5) * this.shakeAmount, (Math.random() - 0.5) * this.shakeAmount, (Math.random() - 0.5) * this.shakeAmount); pos.add(shakeOffset); }
    this.mesh.position.copy(pos); const groupUp = crossNormal.clone().multiplyScalar(this.sideFactor); this.mesh.up.copy(groupUp); this.mesh.lookAt(pos.clone().add(frame.tangent));
    this.mesh.children[0].rotation.z = (this.sideFactor + 1.0) * (Math.PI / 2.0);
    const tilt = -this.angularVelocity * 0.4;
    this.mesh.children[0].rotation.y = THREE.MathUtils.lerp(this.mesh.children[0].rotation.y, tilt, 0.1);

    const rankPos = pos.clone().add(groupUp.clone().multiplyScalar(10.0));
    this.rankLabel.position.copy(rankPos);
    const numPos = pos.clone().add(groupUp.clone().multiplyScalar(-5.0));
    this.numberLabel.position.copy(numPos);
    this.minimapMarker.position.copy(pos);

    this.updateTrail();
    this.updateBlurLines();
    this.flashShield(dt);
    this.updateInvulnerability(dt);
    
    if (dt > 0) {
      this.checkCollisions(track, otherRacers);
      this.checkVehicleCollisions(otherRacers, dt);
    }
    
    if (this.energy <= 0 && !this.isExploded) this.explode();
  }

  explode() {
    this.isExploded = true;
    this.respawnTimer = 3.0;
    this.mesh.visible = false;
    this.trailMesh.visible = false;
    this.minimapMarker.visible = false;
    this.rankLabel.visible = false;
    this.numberLabel.visible = false;
    this.speed = 0;
    if (this.isPlayer) this.cameraShakeRequest = 2.0;
    else if (window.gameInstance) window.gameInstance.showComms(this.pilot, 'onExplode');
  }
  
  checkVehicleCollisions(otherRacers, dt) {
    for (const other of otherRacers) {
      if (other === this || other.isExploded) continue;
      if ((other.sideFactor > 0) !== (this.sideFactor > 0)) continue;
      const tDiff = Math.abs(this.lapProgress - other.lapProgress);
      if (tDiff < 0.001) {
        let angleDiff = this.angle - other.angle;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2; while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        const minAngleDist = 0.25;
        if (Math.abs(angleDiff) < minAngleDist) {
          const pushForce = (minAngleDist - Math.abs(angleDiff)) * 2.0; const direction = angleDiff > 0 ? 1 : -1;
          this.angle += direction * pushForce; other.angle -= direction * pushForce;
          const avgSpeed = (this.speed + other.speed) * 0.5; this.speed = avgSpeed * 0.9; other.speed = avgSpeed * 0.9;
          this.shakeAmount = 1.5; other.shakeAmount = 1.5; 
          this.takeDamage(5, other, otherRacers); 
          other.takeDamage(5, this, otherRacers);
        }
      }
    }
  }

  checkCollisions(track, otherRacers = []) {
    let onRecharge = false;
    for (const item of track.items) {
      if (!item.active && item.type !== 'recharge') continue; 
      const tDiff = Math.abs(this.t - item.t);
      const tolerance = (item.type === 'boost' || item.type === 'recharge') ? 0.015 : 0.005;
      if (tDiff > tolerance && tDiff < (1.0 - tolerance)) continue; 
      if ((this.sideFactor < 0) !== item.isInside) continue;
      let angleDiff = Math.abs(this.angle - item.angle); if (angleDiff > Math.PI) angleDiff = Math.PI * 2 - angleDiff;
      const angleTol = (item.type === 'recharge') ? 0.4 : 0.25;
      if (angleDiff < angleTol) {
        if (item.type === 'recharge') { 
          onRecharge = true; 
          if (this.isPlayer) audioEngine.playRecharge();
          continue; 
        }
        item.active = false; item.mesh.visible = false; item.cooldown = 5.0; 
        if (item.type === 'boost') { 
          this.bonusSpeed = 300; this.speed += 200; 
          if (this.isPlayer) { this.cameraShakeRequest = 1.2; audioEngine.playBoost(); }
        }
        else if (item.type === 'weapon') {          const weapons = ['missile', 'oil', 'barrel']; this.weapon = weapons[Math.floor(Math.random() * weapons.length)];
          if (this.isPlayer) document.getElementById('weapon-display').innerText = `WEAPON: ${this.weapon.toUpperCase()}`;
        } else if (item.type === 'obstacle') { this.speed *= 0.3; this.takeDamage(20, null, otherRacers); }
        }
        }
        if (onRecharge) this.energy = Math.min(this.maxEnergy, this.energy + 50 * 0.016);
        }
        }

        export class AI extends Vehicle {
  constructor(scene, difficulty, pilot) {
    super(scene, Math.floor(Math.random() * 3), false, pilot);
    this.isHuman = false;
    this.difficulty = difficulty; 
    this.t = 0; 
    this.angle = 0;
    this.lapProgress = 0; 
    this.targetAngle = 0; 
    this.reactionTimer = 0;
  }        update(dt, track, player, otherRacers = [], spawnProjectile = null) {
    if (this.isExploded) {
      this.respawnTimer -= dt;
      if (this.respawnTimer <= 0) {
        this.isExploded = false; this.energy = this.maxEnergy * 0.5; this.speed = 0; 
        this.mesh.visible = true;
        if (this.trailMesh.visible !== false) this.trailMesh.visible = true;
        if (this.minimapMarker.visible !== false) this.minimapMarker.visible = true;
        if (this.rankLabel.visible !== false) this.rankLabel.visible = true;
        if (this.numberLabel.visible !== false) this.numberLabel.visible = true;
      }
      return;
    }

    if (dt <= 0) {
      super.update(0, track, { accelerate: false, brake: false, left: false, right: false, switch: false, fire: false }, otherRacers, spawnProjectile);
      return;
    }

    this.reactionTimer -= dt;
    const inputs = { accelerate: true, brake: false, left: false, right: false, switch: false, fire: false };
    let distToPlayer = 0;

    if (this.reactionTimer <= 0) {
      this.reactionTimer = 0.4 - this.difficulty * 0.1;
      let nearestPad = null, nearestObstacle = null, minDistPad = 0.08, minDistObs = 0.04; 
      for (const item of track.items) {
        if (!item.active || item.isInside !== this.isInside) continue;
        let dist = item.t - this.t; if (dist < 0) dist += 1.0;
        if (item.type === 'boost' && dist > 0 && dist < minDistPad) { nearestPad = item; minDistPad = dist; }
        if (item.type === 'obstacle' && dist > 0 && dist < minDistObs) { nearestObstacle = item; minDistObs = dist; }
      }
      if (nearestObstacle) this.targetAngle = nearestObstacle.angle + Math.PI / 2;
      else if (nearestPad && Math.random() < this.pilot.traits.speed_focus) this.targetAngle = nearestPad.angle;
      
      if (player) {
        const dTP = player.lapProgress - this.lapProgress;
        if (Math.abs(dTP) < 0.01 && player.isInside === this.isInside && Math.random() < this.pilot.traits.aggression) this.targetAngle = player.angle;
        if (dTP < 0 && dTP > -0.02 && Math.random() < this.pilot.traits.weaving) this.targetAngle += Math.sin(performance.now() * 0.01) * 0.5;
        if (this.weapon) {
          if (this.weapon === 'missile' && dTP > 0 && dTP < 0.05) this.fireWeapon(spawnProjectile);
          else if (dTP < 0 && dTP > -0.03) this.fireWeapon(spawnProjectile); 
        }
      }
      
      if (Math.random() > 0.98) { this.isInside = !this.isInside; this.targetSideFactor = this.isInside ? -1.0 : 1.0; }
    }

    if (player) {
      distToPlayer = this.lapProgress - player.lapProgress;
    }

    let diffMult = [0.8, 0.92, 1.05][this.difficulty];
    if (player) {
      if (distToPlayer < -0.1) diffMult *= 1.2; else if (distToPlayer > 0.1) diffMult *= 0.9;
      if (distToPlayer > 0.05 && Math.random() > 0.8) inputs.accelerate = false;
      if (this.lap > 1 && this.energy > 40 && (distToPlayer < -0.05 || Math.random() > 0.99)) inputs.fire = true;
    }

    let angleDiff = this.targetAngle - this.angle; while (angleDiff > Math.PI) angleDiff -= Math.PI * 2; while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
    if (angleDiff > 0.1) inputs.right = true; if (angleDiff < -0.1) inputs.left = true;
    
    super.update(dt * diffMult, track, inputs, otherRacers, spawnProjectile);
  }
}
