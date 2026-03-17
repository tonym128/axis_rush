import * as THREE from 'three';
import { textureManager } from './textures.js';
import { GAME_CONFIG } from './constants.js';

export const MAPS = [
  { name: "Neon Tube", diff: "Easy", desc: "A simple loop to learn the ropes.", words: "neon grid cyber", bgWords: "dark blue grid neon" },
  { name: "Acid Loop", diff: "Medium", desc: "Figure-8 with toxic vibes.", words: "green acid toxic cells", bgWords: "dark toxic_bg green stars" },
  { name: "Void Cylinder", diff: "Hard", desc: "A twisting knot in deep space.", words: "purple void dark stars", bgWords: "black nebula stars void" },
  { name: "Desert Worm", diff: "Easy", desc: "Long sweeping sandy curves.", words: "orange sand rough", bgWords: "orange sunrise sand dark" },
  { name: "Frozen Helix", diff: "Medium", desc: "Tight icy coils.", words: "cyan ice crystal shiny", bgWords: "blue ice_bg cyan white stars" },
  { name: "Magma Core", diff: "Hard", desc: "Volcanic twists and turns.", words: "red lava glowing rough", bgWords: "dark lava_bg red glowing" },
  { name: "Bio-Spire", diff: "Medium", desc: "Organic living track.", words: "green pink organic cells", bgWords: "purple nebula organic toxic" },
  { name: "Cyber Grid", diff: "Medium", desc: "Digital circuit paths.", words: "blue circuit neon grid", bgWords: "black matrix neon green" },
  { name: "Plasma Coil", diff: "Hard", desc: "Intense energy fields.", words: "magenta plasma bright", bgWords: "magenta nebula plasma stars" },
  { name: "Quantum Knot", diff: "Extreme", desc: "The ultimate driving test.", words: "white black abstract glitch", bgWords: "black white matrix stars glitch" }
];

export class TrackCurve extends THREE.Curve {
  constructor(mapType) {
    super();
    this.mapType = mapType;
  }
  
  getPoint(t, optionalTarget = new THREE.Vector3()) {
    t *= Math.PI * 2;
    let x = 0, y = 0, z = 0;
    const S = 500;
    
    switch (this.mapType) {
      case 0: x = Math.sin(t) * S * 3; y = Math.sin(t * 2) * S * 0.5; z = Math.cos(t) * S * 3; break;
      case 1: x = Math.sin(t) * S * 4; y = Math.sin(t * 2) * S * 1; z = Math.sin(t * 3) * S * 3; break;
      case 2: x = (S*3 + S * Math.cos(t * 3)) * Math.cos(t * 2); y = (S*3 + S * Math.cos(t * 3)) * Math.sin(t * 2); z = S * Math.sin(t * 3) * 3; break;
      case 3: x = Math.cos(t) * S * 4; y = Math.sin(t * 4) * S * 0.5; z = Math.sin(t) * S * 4; break;
      case 4: x = Math.cos(t) * S * 3 + Math.cos(t * 5) * S * 0.5; z = Math.sin(t) * S * 3 + Math.sin(t * 5) * S * 0.5; y = Math.cos(t * 3) * S; break;
      case 5: x = Math.sin(t) * S * 2 + Math.sin(t * 3) * S; y = Math.cos(t * 2) * S * 2; z = Math.cos(t) * S * 2 + Math.cos(t * 3) * S; break;
      case 6: x = Math.sin(t * 2) * S * 3; y = Math.sin(t * 4) * S; z = Math.cos(t * 2) * S * 3; break;
      case 7: x = Math.sign(Math.cos(t)) * Math.pow(Math.abs(Math.cos(t)), 0.5) * S * 3; y = Math.sin(t * 4) * S * 0.5; z = Math.sign(Math.sin(t)) * Math.pow(Math.abs(Math.sin(t)), 0.5) * S * 3; break;
      case 8: x = Math.cos(t) * (S * 2 + Math.sin(t * 10) * S * 0.5); y = Math.sin(t * 2) * S * 1.5; z = Math.sin(t) * (S * 2 + Math.cos(t * 10) * S * 0.5); break;
      case 9: x = Math.cos(t) * (S * 3) + Math.cos(t * 4) * S; y = Math.sin(t * 3) * S * 2; z = Math.sin(t) * (S * 3) + Math.sin(t * 4) * S; break;
      default: x = Math.sin(t) * S * 3; y = 0; z = Math.cos(t) * S * 3;
    }
    return optionalTarget.set(x, y, z);
  }
}

export class Track {
  constructor(scene, mapType) {
    this.scene = scene;
    this.mapType = mapType;
    this.radius = GAME_CONFIG.TRACK_RADIUS;
    this.segments = GAME_CONFIG.TRACK_SEGMENTS; 
    this.radialSegments = GAME_CONFIG.TRACK_RADIAL_SEGMENTS; 
    this.container = new THREE.Group();
    this.scene.add(this.container);
    
    this.curve = new TrackCurve(mapType);
    const tubeGeo = new THREE.TubeGeometry(this.curve, this.segments, this.radius, this.radialSegments, true);
    const words = MAPS[mapType]?.words || "neon grid cyber";
    const mat = textureManager.getMaterial(words, { side: THREE.DoubleSide, flatShading: true, transparent: true, opacity: 0.7 });
    
    mat.onBeforeCompile = (shader) => {
      shader.uniforms.cameraPos = { value: new THREE.Vector3() };
      
      shader.vertexShader = `
        varying vec3 vWorldPosition;
        ${shader.vertexShader}
      `.replace(
        `#include <worldpos_vertex>`,
        `#include <worldpos_vertex>
         vWorldPosition = (modelMatrix * vec4(transformed, 1.0)).xyz;`
      );

      shader.fragmentShader = `
        uniform vec3 cameraPos;
        varying vec3 vWorldPosition;
        ${shader.fragmentShader}
      `.replace(
        `vec4 diffuseColor = vec4( diffuse, opacity );`,
        `
        float dist = distance(vWorldPosition, cameraPos);
        float alpha = 0.7;
        if (dist < 400.0) {
          alpha = mix(1.0, 0.7, smoothstep(200.0, 400.0, dist));
        }
        vec4 diffuseColor = vec4( diffuse, alpha );
        `
      );
      this.shaderUniforms = shader.uniforms;
    };
    
    this.mesh = new THREE.Mesh(tubeGeo, mat);
    this.container.add(this.mesh);
    
    const wireMat = new THREE.MeshBasicMaterial({ color: 0x00ffff, wireframe: true, transparent: true, opacity: 0.2 });
    this.wireMesh = new THREE.Mesh(tubeGeo, wireMat);
    this.container.add(this.wireMesh);
    
    // Minimap Track Line
    const points = this.curve.getPoints(this.segments);
    const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
    const lineMat = new THREE.LineBasicMaterial({ color: 0x888888 });
    const line = new THREE.LineLoop(lineGeo, lineMat);
    line.layers.set(1);
    this.container.add(line);
    
    this.frames = this.curve.computeFrenetFrames(this.segments, true);
    this.items = [];
    this.markers = [];
    this.generateItems();
    this.addStartMarker();
  }
  
  addStartMarker() {
    const point = this.curve.getPointAt(0);
    const frame = this.getFrameAt(0);
    const geoMap = new THREE.BoxGeometry(this.radius * 3, 5, 10);
    const matMap = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const meshMap = new THREE.Mesh(geoMap, matMap);
    meshMap.position.copy(point);
    meshMap.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), frame.tangent);
    meshMap.layers.set(1);
    this.container.add(meshMap);
    this.markers.push(meshMap);

    const geoGame = new THREE.CylinderGeometry(this.radius + 1.2, this.radius + 1.2, 10, 32, 1, true);
    const matGame = textureManager.getBasicMaterial("checkered", { transparent: true, opacity: 0.8, side: THREE.DoubleSide });
    const meshGame = new THREE.Mesh(geoGame, matGame);
    meshGame.position.copy(point);
    meshGame.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), frame.tangent);
    this.container.add(meshGame);
    this.markers.push(meshGame);
  }

  generateItems() {
    const count = 100 + this.mapType * 10; 
    for (let i = 0; i < count; i++) {
      const t = i / count, point = this.curve.getPointAt(t);
      const frameIdx = Math.floor(t * this.segments), tangent = this.frames.tangents[frameIdx], normal = this.frames.normals[frameIdx];
      const angle = Math.random() * Math.PI * 2, isInside = Math.random() > 0.5, rand = Math.random();
      let type = 'boost'; 
      if (rand > 0.9) type = 'recharge';
      else if (rand > 0.75) type = 'weapon'; 
      else if (rand > 0.5) type = 'obstacle';

      let itemR = isInside ? this.radius - 1 : this.radius + 1;
      if (type === 'weapon') itemR = isInside ? this.radius - 5 : this.radius + 5;
      else if (type === 'obstacle') itemR = isInside ? this.radius - 3 : this.radius + 3;
      else if (type === 'recharge') itemR = isInside ? this.radius - 0.5 : this.radius + 0.5;

      const pos = new THREE.Vector3().copy(point);
      const crossNormal = new THREE.Vector3().copy(normal).applyAxisAngle(tangent, angle);
      pos.add(crossNormal.clone().multiplyScalar(itemR));

      let geo, mat;
      if (type === 'boost') {
        geo = new THREE.BoxGeometry(4, 0.5, 16);
        mat = textureManager.getMaterial("blue electric neon", { emissive: new THREE.Color(0x0088ff), emissiveIntensity: 0.8, transparent: true, opacity: 0.9 });
      } else if (type === 'weapon') {
        geo = new THREE.IcosahedronGeometry(2, 0);
        mat = textureManager.getMaterial("red shiny crystal glowing", { color: 0xff0000 });
      } else if (type === 'recharge') {
        geo = new THREE.BoxGeometry(6, 0.2, 20);
        mat = textureManager.getMaterial("magenta neon glowing", { emissive: new THREE.Color(0xff00ff), emissiveIntensity: 1.0, transparent: true, opacity: 0.6 });
      } else {
        geo = new THREE.BoxGeometry(4, 6, 4);
        mat = textureManager.getMaterial("brown crate rough", { flatShading: true });
      }
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(pos);
      const up = isInside ? crossNormal.clone().negate() : crossNormal.clone();
      const lookTarget = pos.clone().add(tangent);
      mesh.up.copy(up); mesh.lookAt(lookTarget);
      this.container.add(mesh);

      const boundingBox = new THREE.Box3().setFromObject(mesh);
      this.items.push({ type, mesh, t, angle, isInside, active: true, cooldown: 0, boundingBox });
    }
  }
  
  update(dt, camera) {
    if (this.shaderUniforms && camera) {
      this.shaderUniforms.cameraPos.value.copy(camera.position);
    }
    for (const item of this.items) {
      if (item.active && item.type === 'weapon') { item.mesh.rotation.y += dt * 2; item.mesh.rotation.z += dt; }
      else if (!item.active) { item.cooldown -= dt; if (item.cooldown <= 0) { item.active = true; item.mesh.visible = true; } }
    }
  }
  
  getFrameAt(t) {
    t = t % 1.0; if (t < 0) t += 1.0;
    const floatIdx = t * this.segments, idx = Math.floor(floatIdx), nextIdx = (idx + 1) % this.segments, blend = floatIdx - idx;
    const point = this.curve.getPointAt(t);
    const tangent = new THREE.Vector3().copy(this.frames.tangents[idx]).lerp(this.frames.tangents[nextIdx], blend).normalize();
    const normal = new THREE.Vector3().copy(this.frames.normals[idx]).lerp(this.frames.normals[nextIdx], blend).normalize();
    const binormal = new THREE.Vector3().copy(this.frames.binormals[idx]).lerp(this.frames.binormals[nextIdx], blend).normalize();
    return { point, tangent, normal, binormal };
  }
}
