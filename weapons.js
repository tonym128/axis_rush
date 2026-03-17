import * as THREE from 'three';
import { GAME_CONFIG } from './constants.js';

export class WeaponSystem {
  constructor(scene, track) {
    this.scene = scene;
    this.track = track;
    this.projectiles = [];
    this.hazards = [];
  }

  spawn(type, owner) {
    if (type === 'missile') {
      this.spawnMissile(owner);
    } else if (type === 'oil' || type === 'barrel') {
      this.spawnHazard(type, owner);
    }
  }

  spawnMissile(owner) {
    const geo = new THREE.ConeGeometry(1, 4, 8);
    geo.rotateX(Math.PI / 2);
    const mat = new THREE.MeshBasicMaterial({ color: 0xff4400 });
    const mesh = new THREE.Mesh(geo, mat);
    
    this.projectiles.push({
      type: 'missile',
      mesh: mesh,
      owner: owner,
      t: owner.t,
      angle: owner.angle,
      sideFactor: owner.targetSideFactor,
      speed: owner.speed + GAME_CONFIG.MISSILE_SPEED_BONUS,
      life: GAME_CONFIG.MISSILE_LIFE,
      boundingBox: new THREE.Box3()
    });
    this.scene.add(mesh);
  }

  spawnHazard(type, owner) {
    let geo, mat;
    if (type === 'oil') {
      geo = new THREE.CircleGeometry(5, 16);
      geo.rotateX(-Math.PI / 2);
      mat = new THREE.MeshBasicMaterial({ color: 0xaa00ff, transparent: true, opacity: 0.6 });
    } else {
      geo = new THREE.CylinderGeometry(2, 2, 4, 8);
      mat = new THREE.MeshBasicMaterial({ color: 0x444444 });
    }
    
    const mesh = new THREE.Mesh(geo, mat);
    const pos = owner.mesh.position.clone();
    mesh.position.copy(pos);
    mesh.quaternion.copy(owner.mesh.quaternion);
    
    this.hazards.push({
      type: type,
      mesh: mesh,
      owner: owner,
      t: owner.t,
      angle: owner.angle,
      sideFactor: owner.targetSideFactor,
      life: GAME_CONFIG.HAZARD_LIFE,
      boundingBox: new THREE.Box3().setFromObject(mesh)
    });
    this.scene.add(mesh);
  }

  update(dt, racers) {
    // Update Missiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.life -= dt;
      
      p.t += (p.speed * dt) / GAME_CONFIG.TRACK_TOTAL_LENGTH;
      
      if (p.life <= 0 || p.t >= 1.0) {
        this.scene.remove(p.mesh);
        this.projectiles.splice(i, 1);
        continue;
      }

      const frame = this.track.getFrameAt(p.t);
      const crossNormal = new THREE.Vector3().copy(frame.normal).applyAxisAngle(frame.tangent, p.angle);
      let r = this.track.radius + (p.sideFactor * 2.0);
      const pos = new THREE.Vector3().copy(frame.point).add(crossNormal.multiplyScalar(r));
      p.mesh.position.copy(pos);
      p.mesh.lookAt(pos.clone().add(frame.tangent));
      p.boundingBox.setFromObject(p.mesh);

      for (const racer of racers) {
        if (racer === p.owner || racer.isExploded) continue;
        if ((racer.sideFactor > 0) !== (p.sideFactor > 0)) continue;
        
        if (p.boundingBox.intersectsBox(racer.boundingBox)) {
          racer.takeDamage(GAME_CONFIG.MISSILE_DAMAGE, p.owner, racers);
          racer.speed *= 0.5;
          p.life = 0; 
          break;
        }
      }
    }

    // Update Hazards
    for (let i = this.hazards.length - 1; i >= 0; i--) {
      const h = this.hazards[i];
      h.life -= dt;
      if (h.life <= 0) {
        this.scene.remove(h.mesh);
        this.hazards.splice(i, 1);
        continue;
      }

      for (const racer of racers) {
        if (racer.isExploded) continue;
        if ((racer.sideFactor > 0) !== (h.sideFactor > 0)) continue;
        
        const tDiff = Math.abs(racer.t - h.t);
        if (racer === h.owner && tDiff < 0.005) continue;
        
        if (h.boundingBox.intersectsBox(racer.boundingBox)) {
          if (h.type === 'oil') {
            racer.angularVelocity += (Math.random() - 0.5) * GAME_CONFIG.OIL_SPIN_FORCE; 
            racer.speed *= 0.8;
          } else {
            racer.takeDamage(GAME_CONFIG.HAZARD_DAMAGE, h.owner, racers);
            racer.speed *= 0.4;
          }
          this.scene.remove(h.mesh);
          this.hazards.splice(i, 1);
          break;
        }
      }
    }
  }
}
