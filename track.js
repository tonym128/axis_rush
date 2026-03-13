import * as THREE from 'three';
import { textureManager } from './textures.js';

export class TrackCurve extends THREE.Curve {
  constructor(mapType) {
    super();
    this.mapType = mapType;
  }
  
  getPoint(t, optionalTarget = new THREE.Vector3()) {
    t *= Math.PI * 2;
    let x, y, z;
    
    if (this.mapType === 0) {
      // Neon Tube (Easy) - Simple loop
      x = Math.sin(t) * 1500;
      y = Math.sin(t * 2) * 200;
      z = Math.cos(t) * 1500;
    } else if (this.mapType === 1) {
      // Acid Loop (Medium) - Figure 8
      x = Math.sin(t) * 2000;
      y = Math.sin(t * 2) * 500;
      z = Math.sin(t * 3) * 1500;
    } else {
      // Void Cylinder (Hard) - Complex knot
      x = (1500 + 500 * Math.cos(t * 3)) * Math.cos(t * 2);
      y = (1500 + 500 * Math.cos(t * 3)) * Math.sin(t * 2);
      z = 500 * Math.sin(t * 3) * 3;
    }
    
    return optionalTarget.set(x, y, z);
  }
}

export class Track {
  constructor(scene, mapType) {
    this.scene = scene;
    this.mapType = mapType;
    this.radius = 20;
    this.segments = 300;
    this.radialSegments = 16; // Low poly feel
    
    this.curve = new TrackCurve(mapType);
    
    // Generate main track mesh
    const tubeGeo = new THREE.TubeGeometry(
      this.curve, 
      this.segments, 
      this.radius, 
      this.radialSegments, 
      true
    );
    
    // Different textures based on map
    const words = [
      "neon grid cyber",
      "green acid toxic cells",
      "purple void dark stars"
    ];
    
    const mat = textureManager.getMaterial(words[mapType], { 
      side: THREE.DoubleSide,
      flatShading: true,
      wireframe: false
    });
    
    this.mesh = new THREE.Mesh(tubeGeo, mat);
    this.scene.add(this.mesh);
    
    // Add wireframe overlay for retro vibe
    const wireMat = new THREE.MeshBasicMaterial({ 
      color: 0x00ffff, 
      wireframe: true, 
      transparent: true, 
      opacity: 0.2 
    });
    const wireMesh = new THREE.Mesh(tubeGeo, wireMat);
    this.scene.add(wireMesh);
    
    // Calculate Frenet frames for physics
    this.frames = this.curve.computeFrenetFrames(this.segments, true);
    
    // Generate Powerups / Speed pads
    this.items = [];
    this.generateItems();
  }
  
  generateItems() {
    const count = 50 + this.mapType * 20;
    
    for (let i = 0; i < count; i++) {
      const t = i / count;
      const point = this.curve.getPointAt(t);
      
      const frameIdx = Math.floor(t * this.segments);
      const tangent = this.frames.tangents[frameIdx];
      const normal = this.frames.normals[frameIdx];
      const binormal = this.frames.binormals[frameIdx];
      
      const angle = Math.random() * Math.PI * 2;
      const isInside = Math.random() > 0.5;
      const type = Math.random() > 0.7 ? 'weapon' : 'boost';
      
      let itemR = isInside ? this.radius - 1 : this.radius + 1;
      if (type === 'weapon') {
        itemR = isInside ? this.radius - 5 : this.radius + 5;
      }
      
      // Calculate position
      const pos = new THREE.Vector3().copy(point);
      const crossNormal = new THREE.Vector3().copy(normal).applyAxisAngle(tangent, angle);
      pos.add(crossNormal.clone().multiplyScalar(itemR));
      
      // Create mesh
      let geo, mat;
      if (type === 'boost') {
        geo = new THREE.BoxGeometry(4, 0.5, 8);
        mat = textureManager.getMaterial("yellow neon grid", { 
          emissive: new THREE.Color(0xffff00),
          emissiveIntensity: 0.5,
          transparent: true,
          opacity: 0.8
        });
      } else {
        geo = new THREE.IcosahedronGeometry(2, 0);
        mat = textureManager.getMaterial("red shiny crystal glowing", { color: 0xff0000 });
      }
      
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(pos);
      
      // Orient correctly
      const up = isInside ? crossNormal.clone().negate() : crossNormal.clone();
      const lookTarget = pos.clone().add(tangent);
      mesh.up.copy(up);
      mesh.lookAt(lookTarget);
      
      this.scene.add(mesh);
      
      this.items.push({
        type,
        mesh,
        t,
        angle,
        isInside,
        active: true,
        cooldown: 0
      });
    }
  }
  
  update(dt) {
    for (const item of this.items) {
      if (item.active && item.type === 'weapon') {
        item.mesh.rotation.y += dt * 2;
        item.mesh.rotation.z += dt;
      } else if (!item.active) {
        item.cooldown -= dt;
        if (item.cooldown <= 0) {
          item.active = true;
          item.mesh.visible = true;
        }
      }
    }
  }
  
  getFrameAt(t) {
    t = t % 1.0;
    if (t < 0) t += 1.0;
    
    const floatIdx = t * this.segments;
    const idx = Math.floor(floatIdx);
    const nextIdx = (idx + 1) % this.segments;
    const blend = floatIdx - idx;
    
    const point = this.curve.getPointAt(t);
    const tangent = new THREE.Vector3().copy(this.frames.tangents[idx]).lerp(this.frames.tangents[nextIdx], blend).normalize();
    const normal = new THREE.Vector3().copy(this.frames.normals[idx]).lerp(this.frames.normals[nextIdx], blend).normalize();
    const binormal = new THREE.Vector3().copy(this.frames.binormals[idx]).lerp(this.frames.binormals[nextIdx], blend).normalize();
    
    return { point, tangent, normal, binormal };
  }
}
