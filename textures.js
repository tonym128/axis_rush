import * as THREE from 'three';
import TexGen from 'texgenjs';

// Expanded Word Parser for TexGenJS
const WORDS = {
  "red": "c = vec3(1.0, 0.1, 0.1);",
  "green": "c = vec3(0.1, 0.8, 0.1);",
  "blue": "c = vec3(0.1, 0.1, 1.0);",
  "yellow": "c = vec3(1.0, 1.0, 0.1);",
  "purple": "c = vec3(0.5, 0.0, 0.5);",
  "cyan": "c = vec3(0.1, 1.0, 1.0);",
  "magenta": "c = vec3(1.0, 0.1, 1.0);",
  "black": "c = vec3(0.0);",
  "white": "c = vec3(1.0);",
  "orange": "c = vec3(1.0, 0.5, 0.1);",
  "grid": "f = (sin(p.x*20.0)*0.5+0.5) * (sin(p.y*20.0)*0.5+0.5); c = mix(c, c*f, 0.5);",
  "neon": "c = mix(c, vec3(0.1, 1.0, 0.1), 0.5); c *= 2.0;",
  "cyber": "f = noise(p*10.0, 10.0); c = mix(c, vec3(0.0, 1.0, 1.0)*f, 0.5);",
  "toxic": "f = voronoi(p*10.0); c = mix(c, vec3(0.2, 0.8, 0.1), f);",
  "void": "f = fbm(p*5.0, 10.0); c = mix(c, vec3(0.0), f);",
  "dark": "c *= 0.3;",
  "stars": "f = pow(random(p), 100.0); c += vec3(f);",
  "metal": "c = mix(c, vec3(0.7), 0.5); c += vec3(pow(max(0.0, 1.0-length(p-0.5)), 5.0));",
  "shiny": "c += vec3(pow(max(0.0, 1.0-length(p-0.5)), 5.0)*0.5);",
  "crystal": "f = voronoi(p*10.0); f = 1.0 - smoothstep(0.0, 0.1, abs(f-0.5)); c = mix(c, vec3(0.7, 0.9, 1.0), f);",
  "dirty": "f = noise(p*50.0, 10.0); c *= (0.8 + 0.2*f);",
  "cells": "f = 1.0 - voronoi(p*10.0); c = mix(c, vec3(f*f), 0.5);",
  "glowing": "c += vec3(1.0, 0.5, 0.2) * (1.0-length(p-0.5)) * 0.5;",
  "rough": "c *= (0.9 + 0.1*random(p));",
  "plasma": "f = sin(p.x*10.0) + sin(p.y*10.0); c = mix(c, vec3(f, 0.0, 1.0-f), 0.5);",
  "stripes": "f = step(0.5, fract(p.x * 10.0)); c = mix(c, c*0.5, f);",
  "circuit": "f = step(0.95, random(floor(p*20.0))); c = mix(c, vec3(0.0, 1.0, 0.0), f);"
};

function parseWords(str) {
  const parts = str.split(' ');
  const shaderParts = [
    "void main() {",
    "  vec2 p = vUv;",
    "  vec3 c = vec3(0.5);",
    "  float f = 1.0;"
  ];
  
  parts.forEach(w => {
    if (WORDS[w]) shaderParts.push(WORDS[w]);
  });
  
  shaderParts.push("  gl_FragColor = vec4(c, 1.0);");
  shaderParts.push("}");
  
  return shaderParts.join("\n");
}

export class TextureManager {
  constructor() {
    this.texgen = new TexGen();
    this.cache = {};
  }

  getTexture(words) {
    if (this.cache[words]) {
      return this.cache[words];
    }
    
    try {
      const shader = parseWords(words);
      const dataUrl = this.texgen.bake(shader, { width: 512, height: 512 });
      
      const texture = new THREE.Texture();
      const img = new Image();
      img.onload = () => {
        texture.image = img;
        texture.needsUpdate = true;
      };
      img.src = dataUrl;
      
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      
      this.cache[words] = texture;
      return texture;
    } catch(e) {
      console.error("Failed to generate texture for", words, e);
      const canvas = document.createElement('canvas');
      canvas.width = 64; canvas.height = 64;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = words.includes('red') ? '#f00' : (words.includes('green') ? '#0f0' : '#888');
      ctx.fillRect(0,0,64,64);
      return new THREE.CanvasTexture(canvas);
    }
  }

  getMaterial(words, options = {}) {
    const map = this.getTexture(words);
    return new THREE.MeshStandardMaterial({
      map: map,
      roughness: 0.5,
      metalness: 0.2,
      ...options
    });
  }
}

export const textureManager = new TextureManager();
