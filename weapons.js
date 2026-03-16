import * as THREE from 'three';

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
      speed: owner.speed + 200,
      life: 5.0
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
      life: 15.0
    });
    this.scene.add(mesh);
  }

  update(dt, racers) {
    // Update Missiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.life -= dt;
      
      const trackLength = 12000;
      p.t += (p.speed * dt) / trackLength;
      
      if (p.life <= 0 || p.t >= 1.0) {
        this.scene.remove(p.mesh);
        this.projectiles.splice(i, 1);
        continue;
      }

      // Update transform
      const frame = this.track.getFrameAt(p.t);
      const crossNormal = new THREE.Vector3().copy(frame.normal).applyAxisAngle(frame.tangent, p.angle);
      let r = this.track.radius + (p.sideFactor * 2.0);
      const pos = new THREE.Vector3().copy(frame.point).add(crossNormal.multiplyScalar(r));
      p.mesh.position.copy(pos);
      p.mesh.lookAt(pos.clone().add(frame.tangent));

      // Check hits
      for (const racer of racers) {
        if (racer === p.owner || racer.isExploded) continue;
        if ((racer.sideFactor > 0) !== (p.sideFactor > 0)) continue;
        
        const dist = racer.mesh.position.distanceTo(pos);
        if (dist < 10) {
          racer.takeDamage(30, p.owner, racers);
          racer.speed *= 0.5;
          p.life = 0; // Destroy missile
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

      // Check hits
      for (const racer of racers) {
        if (racer.isExploded) continue;
        if ((racer.sideFactor > 0) !== (h.sideFactor > 0)) continue;
        
        // Don't hit the owner immediately after dropping
        const tDiff = Math.abs(racer.t - h.t);
        if (racer === h.owner && tDiff < 0.005) continue;
        
        if (tDiff < 0.002) {
          let angleDiff = Math.abs(racer.angle - h.angle);
          if (angleDiff > Math.PI) angleDiff = Math.PI * 2 - angleDiff;
          if (angleDiff < 0.2) {
            if (h.type === 'oil') {
              racer.angularVelocity += (Math.random() - 0.5) * 10; // Spin out
              racer.speed *= 0.8;
            } else {
              racer.takeDamage(15, h.owner, racers);
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
}
