import * as THREE from 'three';
import { textureManager } from './textures.js';
import { audioEngine } from './audio.js';
import { Track, MAPS } from './track.js';
import { Vehicle, AI } from './vehicle.js';
import { WeaponSystem } from './weapons.js';
import { NetworkManager } from './network.js';
import { 
  PILOTS, 
  VEHICLES, 
  VEHICLE_BASE_STATS, 
  STAT_MAX,
  GAME_CONFIG,
  DIFFICULTY_SETTINGS
} from './constants.js';
import { 
  EffectComposer, 
  RenderPass, 
  EffectPass, 
  PixelationEffect,
  ChromaticAberrationEffect,
  BloomEffect
} from 'postprocessing';


class Game {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: false, powerPreference: "high-performance" });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(1);
    this.scene = new THREE.Scene(); this.scene.background = new THREE.Color(0x000000);
    this.camera = new THREE.PerspectiveCamera(GAME_CONFIG.CAMERA_FOV_BASE, window.innerWidth / window.innerHeight, 0.1, 10000);
    this.minimapCamera = new THREE.PerspectiveCamera(45, 1, 1, 40000);
    this.minimapCamera.layers.set(1); 
    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.pixelEffect = new PixelationEffect(2); this.chromaticEffect = new ChromaticAberrationEffect();
    this.bloomEffect = new BloomEffect({ luminanceThreshold: 0.2, intensity: 1.5 });
    const chromaticPass = new EffectPass(this.camera, this.chromaticEffect, this.bloomEffect);
    const pixelPass = new EffectPass(this.camera, this.pixelEffect);
    this.composer.addPass(chromaticPass); this.composer.addPass(pixelPass);
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5); 
    ambientLight.layers.enable(1);
    this.scene.add(ambientLight);
    const sunLight = new THREE.DirectionalLight(0xffffff, 1); 
    sunLight.position.set(100, 100, 50); 
    sunLight.layers.enable(1);
    this.scene.add(sunLight);
    this.state = 'MENU'; this.gameMode = 'SINGLE'; this.playerPilotId = 0; this.vehicleType = 0; this.mapType = 0; this.difficulty = 1; this.carouselIndex = 0;
    this.campaignTrackIndex = 0; this.campaignScores = {};
    // Per-pilot data: { pilotId: { campaign: { inProgress, trackIndex, scores, vehicleId, difficulty }, upgrades: { vehicleType: { speed, handling, armor } } } }
    this.pilotData = {};
    this.player = null; this.ais = []; this.track = null; this.previewTrack = null; this.previewSky = null; this.previewVehicle = null; this.weaponSystem = null;
    this.clock = (THREE.Timer) ? new THREE.Timer() : new THREE.Clock(); 
    this.inputs = { accelerate: false, brake: false, left: false, right: false, switch: false, fire: false, boost: false, rearView: false };
    this.startCamPos = new THREE.Vector3(); this.countdownTimer = 0; this.countdownTotal = GAME_CONFIG.COUNTDOWN_DURATION; this.cameraShakeIntensity = 0;
    this.playerLastLap = 1; this.bestLapTimes = {};
    this.ghostDiffTimer = 0;
    this.currentThrottle = 0;
    this.lastTimetableSync = 0;
    this.focusedElement = null;
    this.network = new NetworkManager(this);
    this.remoteInputs = {};
    this.netGraphData = [];
    this.settings = {
      audio: { master: 0.5, music: 0.1, sfx: 0.8 },
      kb: {
        accelerate: 'ArrowUp', brake: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight', 
        switch: 'Space', fire: 'KeyQ', boost: 'KeyW', rearView: 'KeyE', pause: 'Escape'
      },
      gp: {
        accelerate: 0, brake: 1, left: 14, right: 15, // buttons (using standard mapping)
        switch: 2, fire: 3, boost: 5, rearView: 4, pause: 9
      }
      };
      this.unlockedImages = ['axis-rush.jpg'];
      this.loadData();
    this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (this.isMobile) document.body.classList.add('is-mobile');

    // Register Service Worker for PWA
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').then(reg => {
          console.log('SW registered:', reg);
        }).catch(err => {
          console.log('SW failed:', err);
        });
      });
    }

    // Handle PWA installation
    this.deferredPrompt = null;
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      const installBtn = document.getElementById('btn-install-pwa');
      if (installBtn) installBtn.style.display = 'block';
    });

    window.addEventListener('appinstalled', () => {
      this.deferredPrompt = null;
      const installBtn = document.getElementById('btn-install-pwa');
      if (installBtn) installBtn.style.display = 'none';
    });

    this.setupUI(); this.setupInputs(); this.setupTouchControls();
    window.addEventListener('resize', () => this.onResize());
    window.addEventListener('orientationchange', () => setTimeout(() => this.onResize(), 200));
    
    window.gameInstance = this; // Global access for vehicle events

    // Initialize attract screen
    this.state = ''; // reset state so showMenu triggers full init
    this.showMenu();
    
    this.loop();
  }

  loadData() {
    const saved = localStorage.getItem('racerSaveData');
    if (saved) {
      const data = JSON.parse(saved);
      this.credits = data.credits || 0;
      this.bestLaps = data.bestLaps || {};
      this.bestLapTimes = data.bestLapTimes || {};
      this.unlockedImages = data.unlockedImages || ['axis-rush.jpg'];
      this.pilotData = data.pilotData || {};
      
      // Migration: convert old global upgrades/leagueData to per-pilot (default to pilot 0)
      if (data.upgrades && !this.pilotData[0]) {
        this.pilotData[0] = this.getPilotData(0);
        this.pilotData[0].upgrades = data.upgrades;
        if (data.leagueData) this.pilotData[0].campaign = data.leagueData;
      }

      if (data.settings) {
        if (data.settings.audio) Object.assign(this.settings.audio, data.settings.audio);
        if (data.settings.kb) Object.assign(this.settings.kb, data.settings.kb);
        if (data.settings.gp) Object.assign(this.settings.gp, data.settings.gp);
      }
      this.applySettings();
    } else {
      this.credits = 0;
      this.bestLaps = {};
      this.bestLapTimes = {};
      this.unlockedImages = ['axis-rush.jpg'];
      this.pilotData = {};
      this.applySettings();
    }
  }

  saveData() {
    localStorage.setItem('racerSaveData', JSON.stringify({
      credits: this.credits,
      bestLaps: this.bestLaps,
      bestLapTimes: this.bestLapTimes,
      settings: this.settings,
      pilotData: this.pilotData,
      unlockedImages: this.unlockedImages
    }));
  }

  getPilotData(pilotId) {
    if (!this.pilotData[pilotId]) {
      this.pilotData[pilotId] = {
        campaign: { inProgress: false, trackIndex: 0, scores: {}, vehicleId: 0, difficulty: 1 },
        completedDifficulties: [], // e.g. [0] if Novice is completed
        upgrades: {
          0: { speed: 0, handling: 0, armor: 0 },
          1: { speed: 0, handling: 0, armor: 0 },
          2: { speed: 0, handling: 0, armor: 0 }
        }
      };
    }
    return this.pilotData[pilotId];
  }

  unlockGalleryImage(src) {
    if (!src) return;
    const filename = src.split('/').pop();
    if (!this.unlockedImages.includes(filename)) {
      this.unlockedImages.push(filename);
      this.saveData();
    }
  }

  renderGallery() {
    const grid = document.getElementById('gallery-grid');
    grid.innerHTML = '';
    
    // Define all possible images
    const allImages = ['axis-rush.jpg'];
    PILOTS.forEach(p => {
      const name = p.name.toLowerCase().replace(/ /g, '-');
      allImages.push(`${name}-intro.jpg`);
      allImages.push(`${name}-outro.jpg`);
    });

    allImages.forEach(imgName => {
      const isUnlocked = this.unlockedImages.includes(imgName);
      const item = document.createElement('div');
      item.className = `gallery-item ${isUnlocked ? 'unlocked' : 'locked'}`;
      
      if (isUnlocked) {
        const img = document.createElement('img');
        img.src = `images/${imgName}`;
        img.alt = imgName;
        item.appendChild(img);
        item.onclick = () => {
          document.getElementById('modal-img').src = img.src;
          document.getElementById('image-modal').classList.add('active');
        };
      }
      
      grid.appendChild(item);
    });
    this.onResize();
  }
  
  applySettings() {
    audioEngine.masterGain.gain.setTargetAtTime(this.settings.audio.master, audioEngine.ctx.currentTime, 0.05);
    audioEngine.musicGain.gain.setTargetAtTime(this.settings.audio.music, audioEngine.ctx.currentTime, 0.05);
    audioEngine.sfxGain.gain.setTargetAtTime(this.settings.audio.sfx, audioEngine.ctx.currentTime, 0.05);
  }

  setFocus(el) {
    if (this.focusedElement) this.focusedElement.classList.remove('focused');
    this.focusedElement = el;
    if (this.focusedElement) {
      this.focusedElement.classList.add('focused');
      this.focusedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }

  navigateMenu(dir) {
    const activeScreen = document.querySelector('.screen.active');
    if (!activeScreen) return;
    const focusable = Array.from(activeScreen.querySelectorAll('button, input[type="range"]'));
    if (focusable.length === 0) return;

    let index = focusable.indexOf(this.focusedElement);
    if (dir === 'next') index = (index + 1) % focusable.length;
    else if (dir === 'prev') index = (index - 1 + focusable.length) % focusable.length;
    else if (dir === 'click' && this.focusedElement) {
      this.focusedElement.click();
      return;
    }

    if (index === -1) index = 0;
    this.setFocus(focusable[index]);
  }
  
  showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const screen = document.getElementById(id);
    screen.classList.add('active');
    if (id !== 'track-select') this.clearPreview();
    if (id !== 'car-select') this.clearCarPreview();
    if (id === 'car-select') this.updateCarPreview(this.vehicleType);

    // Default focus to first button or selected button
    const firstBtn = screen.querySelector('button.selected') || screen.querySelector('button');
    if (firstBtn) this.setFocus(firstBtn);

    // Ensure all buttons on this screen handle touch/mouse to gain focus
    screen.querySelectorAll('button, input[type="range"]').forEach(el => {
      if (!el._focusBound) {
        el.addEventListener('mouseenter', () => this.setFocus(el));
        el.addEventListener('touchstart', () => this.setFocus(el), { passive: true });
        el._focusBound = true;
      }
    });
    this.onResize();
  }

  renderSettings() {
    const kbList = document.getElementById('kb-mapping-list');
    kbList.innerHTML = '';
    Object.keys(this.settings.kb).forEach(action => {
      const row = document.createElement('div');
      row.className = 'mapping-row';
      row.innerHTML = `<span>${action.toUpperCase()}</span><button id="kb-${action}">${this.settings.kb[action]}</button>`;
      kbList.appendChild(row);
      row.querySelector('button').addEventListener('click', () => this.captureKey('kb', action));
    });

    const gpList = document.getElementById('gp-mapping-list');
    gpList.innerHTML = '';
    const gamepads = navigator.getGamepads();
    const gp = gamepads.find(g => g !== null);
    if (gp) document.getElementById('gp-info').innerText = `CONNECTED: ${gp.id}`;
    else document.getElementById('gp-info').innerText = "NO CONTROLLER DETECTED (PRESS A BUTTON)";

    Object.keys(this.settings.gp).forEach(action => {
      const row = document.createElement('div');
      row.className = 'mapping-row';
      row.innerHTML = `<span>${action.toUpperCase()}</span><button id="gp-${action}">BTN ${this.settings.gp[action]}</button>`;
      gpList.appendChild(row);
      row.querySelector('button').addEventListener('click', () => this.captureKey('gp', action));
    });
  }

  captureKey(type, action) {
    const btn = document.getElementById(`${type}-${action}`);
    btn.innerText = 'WAITING...';
    btn.style.borderColor = '#ff0';
    
    if (type === 'kb') {
      const onKey = (e) => {
        window.removeEventListener('keydown', onKey);
        e.preventDefault();
        this.settings.kb[action] = e.code;
        btn.innerText = e.code;
        btn.style.borderColor = '';
        this.saveData();
      };
      window.addEventListener('keydown', onKey);
    } else {
      const pollGamepad = () => {
        const gamepads = navigator.getGamepads();
        for (const gp of gamepads) {
          if (!gp) continue;
          for (let i = 0; i < gp.buttons.length; i++) {
            if (gp.buttons[i].pressed) {
              this.settings.gp[action] = i;
              btn.innerText = `BTN ${i}`;
              btn.style.borderColor = '';
              this.saveData();
              return true;
            }
          }
        }
        return false;
      };
      const interval = setInterval(() => {
        if (pollGamepad()) clearInterval(interval);
      }, 100);
    }
  }

  showComms(pilot, type) {
    const box = document.getElementById('comms-box');
    const name = document.getElementById('comms-name');
    const text = document.getElementById('comms-text');
    const portrait = document.getElementById('comms-portrait');
    
    if (this._commsTimeout) clearTimeout(this._commsTimeout);
    
    name.innerText = pilot.name;
    name.style.color = pilot.color.getStyle();
    
    const lines = pilot.dialogue[type];
    if (Array.isArray(lines)) {
      text.innerText = lines[Math.floor(Math.random() * lines.length)];
    } else {
      text.innerText = lines || "Transmission lost...";
    }
    
    portrait.innerHTML = `<img src="${pilot.portrait}" style="width:100%; height:100%; object-fit:cover;">`;
    
    box.classList.add('active');
    this._commsTimeout = setTimeout(() => {
      box.classList.remove('active');
    }, 3000);
  }

  updateShopUI() {
    document.getElementById('shop-credits').innerText = this.credits;
    document.getElementById('shop-vehicle-name').innerText = VEHICLES[this.vehicleType].name;
    const pilotData = this.getPilotData(this.playerPilotId);
    const upg = pilotData.upgrades[this.vehicleType];
    const baseStats = VEHICLE_BASE_STATS[this.vehicleType];
    
    // Show stats with upgrades
    const currentStats = {
      speed: baseStats.speed + (upg.speed * 17.5),
      accel: baseStats.accel + (upg.speed * 10.5),
      handling: baseStats.handling + (upg.handling * 0.4),
      armor: baseStats.armor + (upg.armor * 25)
    };
    
    document.getElementById('car-info-shop').innerHTML = `
      <div style="color:#0ff; font-weight:bold; margin-bottom:10px;">${VEHICLES[this.vehicleType].name}</div>
      ${this.renderStatBars(baseStats, currentStats)}
    `;

    ['speed', 'handling', 'armor'].forEach(stat => {
      const lvl = upg[stat];
      document.getElementById(`lvl-${stat}`).innerText = lvl;
      document.getElementById(`cost-${stat}`).innerText = lvl >= 5 ? 'MAX' : (lvl + 1) * 100;
      });
      this.onResize();
      }
  renderStatBars(base, current) {
    const stats = [
      { label: 'TOP SPEED', key: 'speed' },
      { label: 'ACCEL', key: 'accel' },
      { label: 'HANDLING', key: 'handling' },
      { label: 'ARMOR', key: 'armor' }
    ];
    
    return `
      <div class="stat-bars">
        ${stats.map(s => {
          const baseWidth = (base[s.key] / STAT_MAX[s.key]) * 100;
          const currentWidth = (current[s.key] / STAT_MAX[s.key]) * 100;
          return `
            <div class="stat-row">
              <div class="stat-label">${s.label}</div>
              <div class="stat-bar-bg">
                <div class="stat-bar-base" style="width: ${baseWidth}%"></div>
                <div class="stat-bar-upgrade" style="width: ${currentWidth}%"></div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  buyUpgrade(stat) {
    const pilotData = this.getPilotData(this.playerPilotId);
    const upg = pilotData.upgrades[this.vehicleType];
    const cost = (upg[stat] + 1) * 100;
    if (upg[stat] < 5 && this.credits >= cost) {
      this.credits -= cost;
      upg[stat]++;
      this.saveData();
      this.updateShopUI();
    }
  }

  showConfirm(title, text, onConfirm) {
    document.getElementById('confirm-title').innerText = title;
    document.getElementById('confirm-text').innerText = text;
    const oldYes = document.getElementById('btn-confirm-yes');
    const oldNo = document.getElementById('btn-confirm-no');
    
    // Replace nodes to clear old listeners
    const newYes = oldYes.cloneNode(true);
    const newNo = oldNo.cloneNode(true);
    oldYes.parentNode.replaceChild(newYes, oldYes);
    oldNo.parentNode.replaceChild(newNo, oldNo);

    newYes.addEventListener('click', () => { onConfirm(); });
    newNo.addEventListener('click', () => { this.showScreen(this._prevScreen || 'main-menu'); });
    
    this._prevScreen = document.querySelector('.screen.active').id;
    this.showScreen('confirm-dialog');
  }

  loadStoryImage(imgId, containerId, src) {
    const img = document.getElementById(imgId);
    const container = document.getElementById(containerId);
    container.classList.remove('loaded');
    container.classList.add('loading');
    img.onload = () => {
      container.classList.remove('loading');
      container.classList.add('loaded');
    };
    img.src = src;
  }

  resetGame() {
    this.showConfirm(
      "RESET ALL PROGRESS?", 
      "This will permanently delete ALL credits, upgrades, and best lap times. Are you absolutely sure?",
      () => {
        this.credits = 0;
        this.upgrades = { 
          0: { speed: 0, handling: 0, armor: 0 },
          1: { speed: 0, handling: 0, armor: 0 },
          2: { speed: 0, handling: 0, armor: 0 }
        };
        this.bestLaps = {};
        this.bestLapTimes = {};
        this.unlockedImages = ['axis-rush.jpg'];
        this.leagueData = { inProgress: false, trackIndex: 0, scores: {}, pilotId: 0, vehicleId: 0 };
        this.saveData();
        this.showMenu();      }
    );
  }

  setupUI() {
    // Request full screen on first interaction for mobile
    const requestFS = () => {
      if (this.isMobile && !document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(e => {
          console.log("FS request failed:", e);
        });
      }
      window.removeEventListener('click', requestFS);
      window.removeEventListener('touchstart', requestFS);
    };
    window.addEventListener('click', requestFS);
    window.addEventListener('touchstart', requestFS);

    const fsBtn = document.getElementById('btn-fullscreen');
    if (this.isMobile) {
      fsBtn.style.display = 'block';
      fsBtn.addEventListener('click', () => {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(e => console.log(e));
        }
      });
    }

    document.getElementById('btn-single').addEventListener('click', () => { this.gameMode = 'SINGLE'; this.showScreen('char-select'); this.renderCharList(); });
    document.getElementById('btn-campaign').addEventListener('click', () => { 
      this.gameMode = 'CAMPAIGN'; this.showScreen('char-select'); this.renderCharList(); 
    });
    document.getElementById('btn-multiplayer').addEventListener('click', () => { 
      this.gameMode = 'MULTIPLAYER'; this.showScreen('char-select'); this.renderCharList(); 
    });
    document.getElementById('btn-time-trial').addEventListener('click', () => { this.gameMode = 'TIME_TRIAL'; this.showScreen('char-select'); this.renderCharList(); });

    // Multiplayer Menu Buttons
    document.getElementById('btn-mp-back').addEventListener('click', () => { 
      if (this.network.isHost) this.network.stopHost();
      else if (this.network.hostConnection) this.network.hostConnection.close();
      this.showMenu(); 
    });
    document.getElementById('btn-host-setup').addEventListener('click', () => { this.showScreen('host-setup'); });
    
    document.getElementById('host-mode').addEventListener('change', (e) => {
      document.getElementById('host-track-row').style.display = (e.target.value === 'SINGLE' ? 'flex' : 'none');
    });

    document.getElementById('btn-host-back').addEventListener('click', () => { this.showScreen('multiplayer-menu'); });
    document.getElementById('btn-host-start').addEventListener('click', () => { 
      const mode = document.getElementById('host-mode').value;
      const track = parseInt(document.getElementById('host-track').value);
      const diff = parseInt(document.getElementById('host-diff').value);
      const useAI = document.getElementById('host-ai').checked;
      this.network.startHost(PILOTS[this.playerPilotId].name, this.playerPilotId, this.vehicleType, {
        mode, mapIndex: track, difficulty: diff, useAI
      });
      this.showScreen('mp-lobby');
    });

    document.getElementById('btn-browse-games').addEventListener('click', () => {
      this.showScreen('lobby-browser');
      this.network.initLobbyBrowser((hosts) => this.renderLobbyBrowser(hosts));
    });
    document.getElementById('btn-browser-back').addEventListener('click', () => {
      this.network.closeLobbyBrowser();
      this.showScreen('multiplayer-menu');
    });
    document.getElementById('btn-browser-refresh').addEventListener('click', () => {
      this.network.closeLobbyBrowser();
      this.network.initLobbyBrowser((hosts) => this.renderLobbyBrowser(hosts));
    });

    document.getElementById('btn-lobby-leave').addEventListener('click', () => {
      if (this.network.isHost) this.network.stopHost();
      else if (this.network.hostConnection) this.network.hostConnection.close();
      this.showMenu();
    });
    document.getElementById('btn-lobby-start').addEventListener('click', () => {
      this.network.startGameHost();
    });

    document.getElementById('btn-lobby-ready').addEventListener('click', () => {
      this.network.toggleReady();
    });

    const updateHostLobbyConfig = () => {
      if (!this.network.isHost) return;
      this.network.hostConfig = {
        mode: document.getElementById('lobby-mode').value,
        mapIndex: parseInt(document.getElementById('lobby-track').value),
        difficulty: parseInt(document.getElementById('lobby-diff').value),
        useAI: document.getElementById('lobby-ai').checked
      };
      document.getElementById('lobby-track-row').style.display = (this.network.hostConfig.mode === 'SINGLE' ? 'flex' : 'none');
      this.network.broadcastLobbyState();
    };

    document.getElementById('lobby-mode').addEventListener('change', updateHostLobbyConfig);
    document.getElementById('lobby-track').addEventListener('change', updateHostLobbyConfig);
    document.getElementById('lobby-diff').addEventListener('change', updateHostLobbyConfig);
    document.getElementById('lobby-ai').addEventListener('change', updateHostLobbyConfig);
    
    document.getElementById('btn-league-intro-next').addEventListener('click', () => { this.showCharIntro(); });
    document.getElementById('btn-char-intro-start').addEventListener('click', () => { this.showLeagueStandings(); });
    document.getElementById('btn-char-outro-finish').addEventListener('click', () => { this.showMenu(); });

    document.getElementById('btn-gallery').addEventListener('click', () => { this.showScreen('gallery-menu'); this.renderGallery(); });
    document.getElementById('btn-gallery-back').addEventListener('click', () => { this.showMenu(); });
    document.getElementById('btn-settings').addEventListener('click', () => { this.showScreen('settings-menu'); this.renderSettings(); });
    document.getElementById('btn-settings-back').addEventListener('click', () => { this.showMenu(); });
    
    const installBtn = document.getElementById('btn-install-pwa');
    if (installBtn) {
      installBtn.addEventListener('click', async () => {
        if (this.deferredPrompt) {
          this.deferredPrompt.prompt();
          const { outcome } = await this.deferredPrompt.userChoice;
          console.log(`User response to the install prompt: ${outcome}`);
          this.deferredPrompt = null;
          installBtn.style.display = 'none';
        }
      });
    }

    document.getElementById('btn-reset-game').addEventListener('click', () => { this.resetGame(); });
    
    // Settings Tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        document.querySelectorAll('.settings-content').forEach(c => c.classList.remove('active'));
        document.getElementById(btn.dataset.tab).classList.add('active');
      });
    });

    // Audio Settings
    const masterSlider = document.getElementById('vol-master');
    masterSlider.value = this.settings.audio.master;
    masterSlider.addEventListener('input', (e) => { this.settings.audio.master = parseFloat(e.target.value); this.applySettings(); this.saveData(); });
    
    const musicSlider = document.getElementById('vol-music');
    musicSlider.value = this.settings.audio.music;
    musicSlider.addEventListener('input', (e) => { this.settings.audio.music = parseFloat(e.target.value); this.applySettings(); this.saveData(); });
    
    const sfxSlider = document.getElementById('vol-sfx');
    sfxSlider.value = this.settings.audio.sfx;
    sfxSlider.addEventListener('input', (e) => { this.settings.audio.sfx = parseFloat(e.target.value); this.applySettings(); this.saveData(); });

    document.getElementById('btn-kb-default').addEventListener('click', () => {
      this.settings.kb = { accelerate: 'ArrowUp', brake: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight', switch: 'Space', fire: 'KeyQ', boost: 'KeyW', rearView: 'KeyE', pause: 'Escape' };
      this.renderSettings(); this.saveData();
    });

    document.getElementById('btn-gp-default').addEventListener('click', () => {
      this.settings.gp = { accelerate: 0, brake: 1, left: 14, right: 15, switch: 2, fire: 3, rearView: 4, pause: 9 };
      this.renderSettings(); this.saveData();
    });

    document.getElementById('btn-league-shop').addEventListener('click', () => { this.shopReturnScreen = 'league-standings'; this.showScreen('upgrade-shop'); this.updateShopUI(); });
    document.getElementById('btn-shop-back').addEventListener('click', () => { 
      if (this.shopReturnScreen === 'league-standings') {
        this.showLeagueStandings();
      } else {
        this.showMenu(); 
      }
    });

    document.getElementById('btn-upg-speed').addEventListener('click', () => this.buyUpgrade('speed'));    document.getElementById('btn-upg-handling').addEventListener('click', () => this.buyUpgrade('handling'));
    document.getElementById('btn-upg-armor').addEventListener('click', () => this.buyUpgrade('armor'));

    document.getElementById('btn-shop-prev').addEventListener('click', () => { this.vehicleType = (this.vehicleType - 1 + VEHICLES.length) % VEHICLES.length; this.updateShopUI(); });
    document.getElementById('btn-shop-next').addEventListener('click', () => { this.vehicleType = (this.vehicleType + 1) % VEHICLES.length; this.updateShopUI(); });

    document.getElementById('btn-how').addEventListener('click', () => { this.showScreen('how-to-play'); });
    document.getElementById('btn-how-back').addEventListener('click', () => { this.showMenu(); });
    document.getElementById('btn-char-next-screen').addEventListener('click', () => { 
      const pilotData = this.getPilotData(this.playerPilotId);
      if (this.gameMode === 'CAMPAIGN' && pilotData.campaign.inProgress) {
        this.continueCampaign();
      } else {
        this.showScreen('car-select'); 
      }
    });
    document.getElementById('btn-char-prev').addEventListener('click', () => {
      this.carouselIndex = (this.carouselIndex - 1 + PILOTS.length) % PILOTS.length;
      this.renderCharList();
    });
    document.getElementById('btn-char-next').addEventListener('click', () => {
      this.carouselIndex = (this.carouselIndex + 1) % PILOTS.length;
      this.renderCharList();
    });
    document.getElementById('btn-char-back').addEventListener('click', () => { this.showMenu(); });
    const carBtns = document.querySelectorAll('#vehicle-select button');
    carBtns.forEach(btn => { btn.addEventListener('click', () => { carBtns.forEach(b => b.classList.remove('selected')); btn.classList.add('selected'); this.vehicleType = parseInt(btn.dataset.val); this.updateCarPreview(this.vehicleType); }); });
    document.getElementById('btn-car-next').addEventListener('click', () => { 
      if (this.gameMode === 'SINGLE' || this.gameMode === 'TIME_TRIAL') { 
        this.showScreen('track-select'); this.renderMapList(); 
      } else if (this.gameMode === 'CAMPAIGN') { 
        this.startCampaign(); 
      } else if (this.gameMode === 'MULTIPLAYER') {
        this.showScreen('multiplayer-menu');
      }
    });
    document.getElementById('btn-car-back').addEventListener('click', () => { this.showScreen('char-select'); this.renderCharList(); });
    document.getElementById('btn-track-start').addEventListener('click', () => { this.startRace(); });
    document.getElementById('btn-track-back').addEventListener('click', () => { this.showScreen('car-select'); });
    const diffBtns = document.querySelectorAll('#diff-select button');
    diffBtns.forEach(btn => { btn.addEventListener('click', () => { diffBtns.forEach(b => b.classList.remove('selected')); btn.classList.add('selected'); this.difficulty = parseInt(btn.dataset.val); }); });
    document.getElementById('restart-btn').addEventListener('click', () => { if (this.gameMode === 'SINGLE' || this.gameMode === 'TIME_TRIAL') this.showMenu(); else this.showLeagueStandings(); });
    document.getElementById('btn-league-next').addEventListener('click', () => { 
      if (this.campaignTrackIndex < MAPS.length) this.startRace(); 
      else {
        const sortedIds = Object.keys(this.campaignScores).sort((a,b) => this.campaignScores[b] - this.campaignScores[a]);
        if (parseInt(sortedIds[0]) === this.playerPilotId) {
          this.showCharOutro();
        } else {
          this.showMenu();
        }
      }
    });
    document.getElementById('btn-league-back').addEventListener('click', () => { this.showMenu(); });
    document.getElementById('btn-resume').addEventListener('click', () => { this.togglePause(); });
    document.getElementById('btn-pause-restart').addEventListener('click', () => { if (this.state === 'PAUSED') this.togglePause(); this.startRace(); });
    document.getElementById('btn-quit').addEventListener('click', () => { this.togglePause(); this.showMenu(); });

    // Image Modal
    const imgModal = document.getElementById('image-modal');
    imgModal.addEventListener('click', () => {
      imgModal.classList.remove('active');
    });

    document.querySelectorAll('.story-img-container').forEach(container => {
      container.addEventListener('click', () => {
        const img = container.querySelector('img');
        if (img && img.src && !container.classList.contains('loading')) {
          document.getElementById('modal-img').src = img.src;
          imgModal.classList.add('active');
        }
      });
    });
  }

  startCampaign() {
    this.gameMode = 'CAMPAIGN';
    this.campaignTrackIndex = 0; 
    this.campaignScores = {}; 
    PILOTS.forEach(p => this.campaignScores[p.id] = 0);
    
    const pilotData = this.getPilotData(this.playerPilotId);
    pilotData.campaign = {
      inProgress: true,
      trackIndex: 0,
      scores: this.campaignScores,
      vehicleId: this.vehicleType,
      difficulty: this.difficulty
    };
    this.saveData();
    this.loadStoryImage('league-intro-img', 'league-intro-img-container', './images/axis-rush.jpg');
    this.unlockGalleryImage('./images/axis-rush.jpg');
    this.showScreen('league-intro');
  }

  continueCampaign() {
    this.gameMode = 'CAMPAIGN';
    const pilotData = this.getPilotData(this.playerPilotId);
    const camp = pilotData.campaign;
    this.campaignTrackIndex = camp.trackIndex;
    this.campaignScores = camp.scores;
    this.vehicleType = camp.vehicleId;
    this.difficulty = camp.difficulty || 1;
    this.showLeagueStandings();
  }

  togglePause() {
    if (this.state === 'RACING') {
      this.state = 'PAUSED';
      this.showScreen('pause-menu');
      audioEngine.ctx.suspend();
    } else if (this.state === 'PAUSED') {
      this.state = 'RACING';
      this.showScreen('hud');
      audioEngine.ctx.resume();
    }
  }

  renderCharList() {
    const list = document.getElementById('char-list'), info = document.getElementById('char-info'), picContainer = document.getElementById('char-pic-container');
    list.innerHTML = '';
    
    // Show 5 pilots in a carousel window
    const visibleCount = 5;
    for (let i = 0; i < visibleCount; i++) {
      const pIdx = (this.carouselIndex + i) % PILOTS.length;
      const p = PILOTS[pIdx];
      
      const btn = document.createElement('button');
      btn.className = 'char-list-btn';
      if (p.id === this.playerPilotId) btn.classList.add('selected');
      btn.innerHTML = `<span>${p.name}</span><img src="${p.portrait}" class="char-list-img">`;

      const updateInfo = (pilot) => {
        const pData = this.getPilotData(pilot.id);
        const camp = pData.campaign;
        let statusHtml = "";
        if (this.gameMode === 'CAMPAIGN') {
          const nextTrack = camp.inProgress ? (MAPS[camp.trackIndex]?.name || "COMPLETE") : "NOT STARTED";
          statusHtml = `
            <div class="info-box status-viewport" style="flex:1;">
              <div style="color:#f0f; font-weight:bold; font-size:0.8rem; margin-bottom:5px;">CAMPAIGN STATUS</div>
              <div style="font-size:0.9rem;">PROGRESS: ${camp.inProgress ? `${camp.trackIndex+1}/${MAPS.length}` : '0/10'}</div>
              <div style="font-size:0.9rem;">NEXT: ${nextTrack}</div>
            </div>
          `;

          const nextBtn = document.getElementById('btn-char-next-screen');
          if (nextBtn) {
            nextBtn.innerText = camp.inProgress ? "CONTINUE CAMPAIGN" : "START NEW CAMPAIGN";
          }
        }

        const upg0 = pData.upgrades[0], upg1 = pData.upgrades[1], upg2 = pData.upgrades[2];
        const upgHtml = `
          <div class="info-box upgrades-viewport" style="flex:1;">
            <div style="color:#0ff; font-weight:bold; font-size:0.8rem; margin-bottom:5px;">INSTALLED UPGRADES</div>
            <div style="font-size:0.7rem; color:#aaa; display:grid; grid-template-columns: 1fr 1fr 1fr; gap:5px;">
              <div>L: S${upg0.speed} H${upg0.handling} A${upg0.armor}</div>
              <div>B: S${upg1.speed} H${upg1.handling} A${upg1.armor}</div>
              <div>H: S${upg2.speed} H${upg2.handling} A${upg2.armor}</div>
            </div>
          </div>
        `;

        info.innerHTML = `
          <div class="info-box story-viewport" style="max-width: none; margin: 0;">
            <div style="color:${pilot.color.getStyle()}; font-weight:bold; margin-bottom:10px; font-size: 1.2rem;">${pilot.faction}</div>
            <div style="font-size:1rem; margin-bottom:15px; line-height:1.6; text-align:left; flex: 1; overflow-y:auto; padding-right: 10px;">${pilot.bg}</div>
            <div style="font-style:italic; color:#ff0; font-size:0.9rem; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 10px;">GOAL: ${pilot.goal}</div>
          </div>
          <div style="display:flex; gap:10px; width:100%; justify-content:center;">
            ${statusHtml}
            ${upgHtml}
          </div>
        `;
        picContainer.innerHTML = `<img src="${pilot.portrait}">`;
      };
      
      btn.addEventListener('click', () => { 
        document.querySelectorAll('#char-list button').forEach(b => b.classList.remove('selected')); 
        btn.classList.add('selected'); 
        this.playerPilotId = p.id; 
        updateInfo(p); 
      });
      
      list.appendChild(btn);
      if (p.id === this.playerPilotId) updateInfo(p);
    }
    this.onResize();
  }

  renderMapList() {
    const list = document.getElementById('map-select'); list.innerHTML = '';
    
    // Determine unlocked tracks based on campaign progress across all pilots
    let maxUnlockedIndex = 0;
    Object.values(this.pilotData).forEach(pd => {
      if (pd.campaign && pd.campaign.trackIndex > maxUnlockedIndex) {
        maxUnlockedIndex = pd.campaign.trackIndex;
      }
    });

    MAPS.forEach((m, idx) => {
      const isLocked = (this.gameMode === 'SINGLE' || this.gameMode === 'TIME_TRIAL') && idx > maxUnlockedIndex;
      const bestLap = this.bestLapTimes[idx] ? `${(this.bestLapTimes[idx] / 1000).toFixed(2)}s` : "NONE";
      const suffix = this.gameMode === 'TIME_TRIAL' ? ` - BEST: ${bestLap}` : ` (${m.diff})`;
      
      const btn = document.createElement('button'); 
      if (isLocked) {
        btn.innerText = `LOCKED: ${m.name}`;
        btn.disabled = true;
        btn.style.opacity = '0.4';
        btn.style.cursor = 'not-allowed';
      } else {
        btn.innerText = `${m.name}${suffix}`;
        if (idx === this.mapType) { btn.classList.add('selected'); this.updatePreview(idx); }
        btn.addEventListener('click', () => { 
          document.querySelectorAll('#map-select button').forEach(b => b.classList.remove('selected')); 
          btn.classList.add('selected'); 
          this.mapType = idx; 
          this.updatePreview(idx); 
        });
      }
      list.appendChild(btn);
    });

    // Update difficulty buttons based on current pilot progress
    const pilotData = this.getPilotData(this.playerPilotId);
    const completed = pilotData.completedDifficulties || [];
    const diffBtns = document.querySelectorAll('#diff-select button');
    
    diffBtns.forEach(btn => {
      const val = parseInt(btn.dataset.val);
      if (val === 0) {
        btn.disabled = false;
        btn.style.opacity = '1';
        btn.innerText = "Novice";
      } else {
        const prevCompleted = completed.includes(val - 1);
        btn.disabled = !prevCompleted;
        btn.style.opacity = prevCompleted ? '1' : '0.4';
        btn.innerText = prevCompleted ? (val === 1 ? "Pro" : "Elite") : "LOCKED";
      }
    });

    this.onResize();
  }

  updatePreview(mapIdx) {
    this.clearPreview(); 
    this.previewTrack = new Track(this.scene, mapIdx); 
    this.previewTrack.container.traverse(obj => obj.layers.set(1));
    
    // Add stage background preview
    const skyGeo = new THREE.SphereGeometry(15000, 32, 32);
    const skyMat = textureManager.getBasicMaterial(MAPS[mapIdx].bgWords, { side: THREE.BackSide, fog: false });
    this.previewSky = new THREE.Mesh(skyGeo, skyMat);
    this.previewSky.layers.set(1);
    this.scene.add(this.previewSky);
  }

  clearPreview() {
    if (this.previewTrack) { this.scene.remove(this.previewTrack.container); this.previewTrack = null; }
    if (this.previewSky) { this.scene.remove(this.previewSky); this.previewSky = null; }
  }

  updateCarPreview(type) {
    this.clearCarPreview();
    const info = document.getElementById('car-info');
    const pilotData = this.getPilotData(this.playerPilotId);
    const upg = pilotData.upgrades[type];
    const baseStats = VEHICLE_BASE_STATS[type];
    const currentStats = {
      speed: baseStats.speed + (upg.speed * 17.5),
      accel: baseStats.accel + (upg.speed * 10.5),
      handling: baseStats.handling + (upg.handling * 0.4),
      armor: baseStats.armor + (upg.armor * 25)
    };

    info.innerHTML = `
      <div style="margin-bottom:10px; text-align: left; width: 100%;">${VEHICLES[type].desc}</div>
      ${this.renderStatBars(baseStats, currentStats)}
    `;

    this.previewVehicle = new Vehicle(this.scene, type, true, PILOTS[this.playerPilotId], upg);
    this.previewVehicle.rankLabel.visible = false; this.previewVehicle.numberLabel.visible = false; this.previewVehicle.minimapMarker.visible = false; this.previewVehicle.trailMesh.visible = false; this.previewVehicle.slipstreamMesh.visible = false; this.previewVehicle.blurLines.visible = false;
    this.previewVehicle.mesh.traverse(obj => obj.layers.set(1)); this.previewVehicle.mesh.position.set(0, 0, 0); this.previewVehicle.mesh.scale.set(5, 5, 5);    
    // Dynamic showroom lighting
    this.previewLights = new THREE.Group();
    const amb = new THREE.AmbientLight(0xffffff, 1.5); amb.layers.enable(1);
    const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 2.0); hemi.layers.enable(1);
    const pl1 = new THREE.PointLight(0xffaa00, 500, 100); pl1.position.set(20, 20, 20); pl1.layers.enable(1);
    const pl2 = new THREE.PointLight(0x00aaff, 500, 100); pl2.position.set(-20, 10, -20); pl2.layers.enable(1);
    const pl3 = new THREE.PointLight(0xffffff, 300, 100); pl3.position.set(0, -10, 20); pl3.layers.enable(1);
    this.previewLights.add(amb, hemi, pl1, pl2, pl3);
    this.scene.add(this.previewLights);
    this.onResize();
  }

  clearCarPreview() {
    if (this.previewVehicle) { this.scene.remove(this.previewVehicle.mesh); this.scene.remove(this.previewVehicle.trailMesh); this.scene.remove(this.previewVehicle.slipstreamMesh); this.scene.remove(this.previewVehicle.rankLabel); this.scene.remove(this.previewVehicle.numberLabel); this.scene.remove(this.previewVehicle.minimapMarker); this.scene.remove(this.previewVehicle.blurLines); this.previewVehicle = null; }
    if (this.previewLights) { this.scene.remove(this.previewLights); this.previewLights = null; }
  }
  
  setupInputs() {
    window.addEventListener('keydown', (e) => {
      if (e.code === this.settings.kb.pause) this.togglePause();
      if (this.state !== 'RACING' && this.state !== 'STARTING') {
        // Menu Navigation
        if (e.code === 'ArrowDown' || e.code === 'ArrowRight' || e.code === 'Tab') { e.preventDefault(); this.navigateMenu('next'); }
        if (e.code === 'ArrowUp' || e.code === 'ArrowLeft') { e.preventDefault(); this.navigateMenu('prev'); }
        if (e.code === 'Space' || e.code === 'Enter') { e.preventDefault(); this.navigateMenu('click'); }
        return;
      }
      const k = this.settings.kb;
      if (e.code === k.accelerate) this.inputs.accelerate = true;
      if (e.code === k.brake) this.inputs.brake = true;
      if (e.code === k.left) this.inputs.left = true;
      if (e.code === k.right) this.inputs.right = true;
      if (e.code === k.switch) this.inputs.switch = true;
      if (e.code === k.fire) this.inputs.fire = true;
      if (e.code === k.boost) this.inputs.boost = true;
      if (e.code === k.rearView) this.inputs.rearView = true;
    });
    window.addEventListener('keyup', (e) => {
      const k = this.settings.kb;
      if (e.code === k.accelerate) this.inputs.accelerate = false;
      if (e.code === k.brake) this.inputs.brake = false;
      if (e.code === k.left) this.inputs.left = false;
      if (e.code === k.right) this.inputs.right = false;
      if (e.code === k.fire) this.inputs.fire = false;
      if (e.code === k.boost) this.inputs.boost = false;
      if (e.code === k.rearView) this.inputs.rearView = false;
    });
    
    // Resume audio on first interaction
    const resumeAudio = () => {
      audioEngine.ctx.resume();
      if (!audioEngine.isPlaying) {
        audioEngine.setMode('menu');
        audioEngine.start();
      }
      window.removeEventListener('click', resumeAudio);
      window.removeEventListener('keydown', resumeAudio);
    };
    window.addEventListener('click', resumeAudio);
    window.addEventListener('keydown', resumeAudio);

    // Auto-pause and sound management on background
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        if (this.state === 'RACING') {
          this.togglePause();
        } else {
          audioEngine.ctx.suspend();
        }
      } else {
        // Resume sound only if not manually paused
        if (this.state !== 'PAUSED') {
          audioEngine.ctx.resume();
        }
      }
    });
  }
  
  setupTouchControls() {
    const leftZone = document.getElementById('touch-left');
    const rightZone = document.getElementById('touch-right');
    const btnBrake = document.getElementById('btn-touch-brake');
    const btnBoost = document.getElementById('btn-touch-boost');
    const btnFire = document.getElementById('btn-touch-fire');

    const setInput = (action, val) => { this.inputs[action] = val; };

    leftZone.addEventListener('touchstart', (e) => { e.preventDefault(); setInput('left', true); }, { passive: false });
    leftZone.addEventListener('touchend', () => setInput('left', false));
    rightZone.addEventListener('touchstart', (e) => { e.preventDefault(); setInput('right', true); }, { passive: false });
    rightZone.addEventListener('touchend', () => setInput('right', false));

    btnBrake.addEventListener('touchstart', (e) => { e.preventDefault(); setInput('brake', true); }, { passive: false });
    btnBrake.addEventListener('touchend', () => setInput('brake', false));
    btnBoost.addEventListener('touchstart', (e) => { e.preventDefault(); setInput('boost', true); }, { passive: false });
    btnBoost.addEventListener('touchend', () => setInput('boost', false));
    btnFire.addEventListener('touchstart', (e) => { e.preventDefault(); setInput('fire', true); }, { passive: false });
    btnFire.addEventListener('touchend', () => setInput('fire', false));

    // Handle center touch for switch side? Or just double tap one zone?
    // Let's add a double tap to either zone to switch
    let lastTap = 0;
    const handleDoubleTap = (e) => {
      const now = performance.now();
      if (now - lastTap < 300) { this.inputs.switch = true; }
      lastTap = now;
    };
    leftZone.addEventListener('touchstart', handleDoubleTap);
    rightZone.addEventListener('touchstart', handleDoubleTap);
  }

  onResize() {
    const w = window.innerWidth, h = window.innerHeight; 
    this.camera.aspect = w / h; 
    this.camera.updateProjectionMatrix(); 
    this.renderer.setSize(w, h); 
    this.composer.setSize(w, h);

    // UI Scaling for small windows
    const baseW = 1280, baseH = 720;
    const scale = Math.min(w / baseW, h / baseH);
    const uiLayer = document.getElementById('ui-layer');
    if (scale < 1.0) {
      uiLayer.style.transform = `scale(${scale})`;
      uiLayer.style.transformOrigin = 'center center';
      uiLayer.style.width = `${100 / scale}%`;
      uiLayer.style.height = `${100 / scale}%`;
      uiLayer.style.left = `${(1.0 - 1.0/scale) * 50}%`;
      uiLayer.style.top = `${(1.0 - 1.0/scale) * 50}%`;
    } else {
      uiLayer.style.transform = '';
      uiLayer.style.width = '100%';
      uiLayer.style.height = '100%';
      uiLayer.style.left = '0';
      uiLayer.style.top = '0';
    }
  }
  
  showMenu() {
    this.showScreen('main-menu'); audioEngine.setMode('menu');
    audioEngine.stopEngine();

    if (this.state !== 'MENU' || !this.track) {
      this.state = 'MENU';
      while(this.scene.children.length > 0) this.scene.remove(this.scene.children[0]); 
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.5); this.scene.add(ambientLight);
      const sunLight = new THREE.DirectionalLight(0xffffff, 1); sunLight.position.set(100, 100, 50); this.scene.add(sunLight);
      
      // Attract Mode Background
      this.mapType = Math.floor(Math.random() * MAPS.length);
      this.track = new Track(this.scene, this.mapType);
      this.weaponSystem = new WeaponSystem(this.scene, this.track);
      this.ais = [];
      this.player = null;
      PILOTS.forEach(p => { 
        const ai = new AI(this.scene, 2, p);
        ai.minimapMarker.visible = false;
        ai.rankLabel.visible = false;
        ai.numberLabel.visible = false;
        ai.trailMesh.visible = false;
        ai.slipstreamMesh.visible = false;
        ai.blurLines.visible = false;
        this.ais.push(ai); 
      });
      const skyGeo = new THREE.SphereGeometry(5000, 32, 32);
      const skyMat = textureManager.getBasicMaterial(MAPS[this.mapType].bgWords, { side: THREE.BackSide, fog: false });
      const sky = new THREE.Mesh(skyGeo, skyMat); this.scene.add(sky);
      this.attractCamT = 0;
    }
  }

  startCampaign() {
    this.gameMode = 'CAMPAIGN';
    this.campaignTrackIndex = 0; this.campaignScores = {}; PILOTS.forEach(p => this.campaignScores[p.id] = 0);
    this.difficulty = 1;
    const pilotData = this.getPilotData(this.playerPilotId);
    pilotData.campaign = {
      inProgress: true,
      trackIndex: 0,
      scores: this.campaignScores,
      pilotId: this.playerPilotId,
      vehicleId: this.vehicleType,
      difficulty: this.difficulty
    };
    this.saveData();
    this.loadStoryImage('league-intro-img', 'league-intro-img-container', './images/axis-rush.jpg');
    this.unlockGalleryImage('./images/axis-rush.jpg');
    this.showScreen('league-intro');
  }

  showCharIntro() {
    const pilot = PILOTS[this.playerPilotId];
    document.getElementById('char-intro-name').innerText = pilot.name;
    document.getElementById('char-intro-corp').innerText = pilot.corporation;
    document.getElementById('char-intro-text').innerText = pilot.intro;
    document.getElementById('char-intro-enemy').innerText = pilot.enemy.toUpperCase();
    const pic = document.getElementById('char-intro-pic'); pic.innerHTML = `<img src="${pilot.portrait}">`;
    
    const imgName = pilot.name.toLowerCase().replace(/ /g, '-');
    this.loadStoryImage('char-intro-img', 'char-intro-img-container', `./images/${imgName}-intro.jpg`);
    this.unlockGalleryImage(`./images/${imgName}-intro.jpg`);
    
    this.showScreen('char-intro');
  }

  showCharOutro() {
    const pilot = PILOTS[this.playerPilotId];
    document.getElementById('char-outro-name-title').innerText = `VICTORIOUS: ${pilot.name}`;
    document.getElementById('char-outro-text').innerText = pilot.outro;
    const pic = document.getElementById('char-outro-pic'); pic.innerHTML = `<img src="${pilot.portrait}">`;
    
    const imgName = pilot.name.toLowerCase().replace(/ /g, '-');
    this.loadStoryImage('char-outro-img', 'char-outro-img-container', `./images/${imgName}-outro.jpg`);
    this.unlockGalleryImage(`./images/${imgName}-outro.jpg`);

    this.showScreen('char-outro');
  }

  continueCampaign() {
    this.gameMode = 'CAMPAIGN';
    const pilotData = this.getPilotData(this.playerPilotId);
    const camp = pilotData.campaign;
    this.campaignTrackIndex = camp.trackIndex;
    this.campaignScores = camp.scores;
    this.vehicleType = camp.vehicleId;
    this.difficulty = camp.difficulty || 1;
    this.showLeagueStandings();
  }

  showLeagueStandings() {
    this.showScreen('league-standings'); this.state = 'STANDINGS';
    const title = document.getElementById('league-title');
    if (this.campaignTrackIndex >= MAPS.length) { 
      title.innerText = "CHAMPIONSHIP RESULTS"; 
      document.getElementById('btn-league-next').innerText = "FINISH"; 
      const pilotData = this.getPilotData(this.playerPilotId);
      pilotData.campaign.inProgress = false;
      
      // Mark this difficulty as completed for this pilot
      if (!pilotData.completedDifficulties) pilotData.completedDifficulties = [];
      if (!pilotData.completedDifficulties.includes(this.difficulty)) {
        pilotData.completedDifficulties.push(this.difficulty);
      }
      
      this.saveData();
    }
    else { 
      const campaign = this.getPilotData(this.playerPilotId).campaign;
      this.difficulty = campaign.difficulty !== undefined ? campaign.difficulty : 1;
      title.innerText = `NEXT: ${MAPS[this.campaignTrackIndex].name} (${this.campaignTrackIndex + 1}/${MAPS.length})`; 
      document.getElementById('btn-league-next').innerText = "START RACE"; 
    }
    const list = document.getElementById('standings-list'); list.innerHTML = '';
    const sortedIds = Object.keys(this.campaignScores).sort((a,b) => this.campaignScores[b] - this.campaignScores[a]);
    sortedIds.forEach((idStr, idx) => {
      const id = parseInt(idStr), row = document.createElement('div');
      row.className = 'standings-row'; if (id === this.playerPilotId) row.classList.add('player');
      row.innerText = `${idx+1}. ${PILOTS[id].name} - ${this.campaignScores[id]} PTS`; list.appendChild(row);
    });
    this.onResize();
  }
  
  startRace() {
    if (this.gameMode === 'CAMPAIGN') this.mapType = this.campaignTrackIndex;
    this.startCamPos.copy(this.camera.position); this.state = 'STARTING'; this.countdownTimer = this.countdownTotal; this.showScreen('hud');
    audioEngine.startEngine();
    const hudPic = document.getElementById('hud-pilot-pic'); hudPic.innerHTML = `<img src="${PILOTS[this.playerPilotId].portrait}">`;
    while(this.scene.children.length > 0) this.scene.remove(this.scene.children[0]); 
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5); 
    ambientLight.layers.enable(1);
    this.scene.add(ambientLight);
    const sunLight = new THREE.DirectionalLight(0xffffff, 1); 
    sunLight.position.set(100, 100, 50); 
    sunLight.layers.enable(1);
    this.scene.add(sunLight);
    this.track = new Track(this.scene, this.mapType);
    this.weaponSystem = new WeaponSystem(this.scene, this.track);
    const pilotData = this.getPilotData(this.playerPilotId);
    this.player = new Vehicle(this.scene, this.vehicleType, true, PILOTS[this.playerPilotId], pilotData.upgrades[this.vehicleType], this.difficulty);
    this.player.minimapMarker.layers.set(1);
    this.player._lapStartTime = performance.now(); // Will be reset at GO!
    this.player._lastRecordedLap = 1;
    
    // Assign starting position for player
    this.player.t = 0.01;
    this.player.angle = -0.4;
    this.player.lapProgress = this.player.t;

    this.ais = []; 
    if (this.gameMode !== 'TIME_TRIAL') {
      PILOTS.forEach((p, idx) => { 
        if (p.id !== this.playerPilotId) {
          const ai = new AI(this.scene, this.difficulty, p);
          ai.minimapMarker.layers.set(1);
          ai._lapStartTime = performance.now();
          ai._lastRecordedLap = 1;
          
          // Stagger AI positions
          const gridIdx = this.ais.length + 1;
          ai.t = 0.01 - (gridIdx * 0.003);
          ai.angle = (gridIdx % 2 === 0 ? -0.4 : 0.4);
          ai.lapProgress = ai.t;
          
          this.ais.push(ai);
        }
      });
    }
    const skyGeo = new THREE.SphereGeometry(5000, 32, 32);
    const skyMat = textureManager.getBasicMaterial(MAPS[this.mapType].bgWords, { side: THREE.BackSide, fog: false });
    const sky = new THREE.Mesh(skyGeo, skyMat); this.scene.add(sky);
    audioEngine.setMode('race', this.mapType, this.difficulty); audioEngine.start(); this.runCountdown();
    
    // Ghost data init
    this.lapStartTime = 0;
    this.currentGhostLap = [];
    this.recordedGhost = this.bestLaps[this.mapType] ? this.bestLaps[this.mapType].path : null;
    this.ghostMesh = null;
    if (this.gameMode === 'TIME_TRIAL' && this.recordedGhost) {
      const geo = new THREE.BoxGeometry(2, 1, 4);
      const mat = new THREE.MeshBasicMaterial({ color: 0x00ffff, wireframe: true, transparent: true, opacity: 0.5 });
      this.ghostMesh = new THREE.Mesh(geo, mat);
      this.scene.add(this.ghostMesh);
    }
  }
  
  async runCountdown() {
    // Synchronized countdown is now handled within the update() loop.
  }
  
  onPlayerLapComplete(lapTime, lapNumber) {
    audioEngine.playLapComplete();
    const msg = document.getElementById('message-display');
    const timeStr = (lapTime / 1000).toFixed(2);
    let bestStr = "";
    
    if (!this.bestLapTimes[this.mapType] || lapTime < this.bestLapTimes[this.mapType]) {
      this.bestLapTimes[this.mapType] = lapTime;
      bestStr = "<div style='color:#0ff; font-size: 2rem;'>NEW BEST LAP!</div>";
      this.saveData();
    } else {
      const diff = (lapTime - this.bestLapTimes[this.mapType]) / 1000;
      bestStr = `<div style='color:#aaa; font-size: 1.5rem;'>BEST: ${(this.bestLapTimes[this.mapType]/1000).toFixed(2)} (+${diff.toFixed(2)})</div>`;
    }

    let gapStr = "";
    if (this.player.rank > 1) {
      const leader = [this.player, ...this.ais].find(r => r.rank === 1);
      if (leader && leader.lapTimes[lapNumber - 1]) {
        const gap = (lapTime - leader.lapTimes[lapNumber - 1]) / 1000;
        gapStr = `<div style='color:#f0f; font-size: 1.5rem;'>GAP TO LEAD: +${gap.toFixed(2)}s</div>`;
      }
    } else {
      gapStr = "<div style='color:#ff0; font-size: 1.5rem;'>POSITION: LEADER</div>";
    }

    msg.innerHTML = `<div>LAP ${lapNumber} COMPLETE</div>
                     <div style='font-size: 3rem;'>${timeStr}s</div>
                     ${bestStr}
                     ${gapStr}`;
    
    setTimeout(() => {
      if (this.state === 'RACING') msg.innerHTML = "";
    }, 4000);
  }

  pollGamepads() {
    const gamepads = navigator.getGamepads();
    const gp = gamepads.find(g => g !== null);
    if (!gp) return;
    
    const g = this.settings.gp;
    this.inputs.accelerate = this.inputs.accelerate || gp.buttons[g.accelerate].pressed;
    this.inputs.brake = this.inputs.brake || gp.buttons[g.brake].pressed;
    this.inputs.left = this.inputs.left || gp.buttons[g.left].pressed || gp.axes[0] < -0.3;
    this.inputs.right = this.inputs.right || gp.buttons[g.right].pressed || gp.axes[0] > 0.3;
    this.inputs.fire = this.inputs.fire || gp.buttons[g.fire].pressed;
    this.inputs.boost = this.inputs.boost || gp.buttons[g.boost].pressed;
    this.inputs.rearView = this.inputs.rearView || gp.buttons[g.rearView].pressed;
    
    if (gp.buttons[g.switch].pressed) {
      if (!this._gpSwitchPressed) { this.inputs.switch = true; this._gpSwitchPressed = true; }
    } else { this._gpSwitchPressed = false; }
    
    if (gp.buttons[g.pause].pressed) {
      if (!this._gpPausePressed) { this.togglePause(); this._gpPausePressed = true; }
    } else { this._gpPausePressed = false; }
  }

  updateRanks(allRacers) {
    const oldPlayerRank = this.player ? this.player.rank : 0;
    allRacers.sort((a, b) => b.lapProgress - a.lapProgress);
    allRacers.forEach((r, idx) => { 
      const oldRank = r.rank; r.rank = idx + 1; 
      if (r.rank !== oldRank) r.updateRankLabel(); 
    });
    
    if (this.player && oldPlayerRank > 0 && this.player.rank > oldPlayerRank) {
      // Player was overtaken
      const overtaker = allRacers[this.player.rank - 2]; // The one now ahead of player
      if (overtaker && !overtaker.isPlayer) {
        this.showComms(overtaker.pilot, 'onOvertake');
      }
    }
  }

  updateHUD() {
    if (!this.player) return;
    let allRacers = [];
    if (this.gameMode === 'MULTIPLAYER' && this.mpPlayers) {
      allRacers = Object.values(this.mpPlayers).concat(this.ais);
    } else {
      allRacers = [this.player, ...this.ais];
    }
    allRacers.sort((a, b) => a.rank - b.rank);
    
    const numPlayers = allRacers.length;
    document.getElementById('pos-display').innerText = `POS: ${this.player.rank}/${numPlayers}`;
    document.getElementById('lap-display').innerText = `LAP: ${Math.min(3, this.player.lap)}/3`;
    document.getElementById('speed-display').innerText = `SPEED: ${Math.floor(this.player.speed)} KM/H`;
    document.getElementById('weapon-display').innerText = `WEAPON: ${(this.player.weapon || 'NONE').toUpperCase()}`;

    // Update Energy Bar
    const energyFill = document.getElementById('energy-bar-fill');
    if (energyFill) {
      const energyPct = Math.max(0, this.player.energy / this.player.maxEnergy * 100);
      energyFill.style.width = `${energyPct}%`;
      // Color shift: blue -> orange -> red
      if (energyPct > 50) energyFill.style.background = '#0ff';
      else if (energyPct > 25) energyFill.style.background = '#ff0';
      else energyFill.style.background = '#f00';
    }

    // Update Throttle Meter
    const throttleFill = document.getElementById('throttle-bar-fill');
    const throttleContainer = document.getElementById('throttle-bar-container');
    if (throttleFill) {
      const val = this.currentThrottle;
      throttleFill.style.width = `${val * 100}%`;
      
      // Color logic: Red (<50%), Green (80-90%), Orange (others)
      if (val < 0.5) throttleFill.style.background = '#f00';
      else if (val >= 0.8 && val <= 0.9) throttleFill.style.background = '#0f0';
      else throttleFill.style.background = '#f80';

      // After countdown, fade out/hide throttle meter
      if (this.state === 'RACING' && (performance.now() - this.lapStartTime) > 2000) {
        throttleContainer.style.display = 'none';
      } else {
        throttleContainer.style.display = 'block';
      }
    }

    const lb = document.getElementById('hud-leaderboard'); lb.innerHTML = '';
    
    // Header for timetable
    const header = document.createElement('div');
    header.className = 'lb-row';
    header.style.color = '#0ff';
    header.style.fontSize = '0.7rem';
    header.innerHTML = `<span>PILOT</span><span>TIME/GAP</span>`;
    lb.appendChild(header);

    allRacers.forEach((r, idx) => {
      const row = document.createElement('div'); row.className = 'lb-row'; 
      if (r.isPlayer) row.classList.add('player');
      else if (r.isHuman) row.style.color = '#0f0'; // Green for other human players
      
      let infoText = "";
      if (r.isPlayer) {
        const myTotalTime = this.player.totalTime || 0;
        const currentLapTime = performance.now() - this.lapStartTime;
        infoText = `${((myTotalTime + currentLapTime) / 1000).toFixed(2)}s`;
      } else {
        // For remote players/AI, use host-synced time if available
        if (r.totalTime !== undefined && r.totalTime > 0) {
          const myTotalTime = this.player.totalTime || 0;
          const currentLapTime = performance.now() - this.lapStartTime;
          const gap = (r.totalTime - (myTotalTime + currentLapTime)) / 1000;
          infoText = gap > 0 ? `+${gap.toFixed(2)}s` : `${gap.toFixed(2)}s`;
        } else {
          // Fallback to distance-based gap estimation
          const gap = (r.lapProgress - this.player.lapProgress) * 12000 / Math.max(100, this.player.speed);
          infoText = gap > 0 ? `+${gap.toFixed(1)}s` : `${gap.toFixed(1)}s`;
        }
      }
      
      row.innerHTML = `<span>${r.rank}. ${r.pilot.name}</span><span>${infoText}</span>`; 
      lb.appendChild(row);
    });
    
    // Time Trial HUD
    if (this.gameMode === 'TIME_TRIAL') {
      const currentLapTime = ((performance.now() - this.currentLapStartTime) / 1000).toFixed(2);
      const bestTime = this.bestLapTimes[this.mapType] ? (this.bestLapTimes[this.mapType] / 1000).toFixed(2) : '--.--';
      let diffStr = "";
      if (this.ghostTimeDiff !== null) {
        const color = this.ghostTimeDiff > 0 ? "#0f0" : "#f00";
        const sign = this.ghostTimeDiff > 0 ? "-" : "+"; // if ghost time is 30 and player is 32, diff is -2, so player is +2 behind
        diffStr = `<span style="color:${color}; font-size: 1.2rem; margin-top: 5px;">GHOST: ${sign}${Math.abs(this.ghostTimeDiff).toFixed(2)}s</span>`;
      }
      lb.innerHTML = `<div class="lb-row player" style="flex-direction: column; align-items:flex-start;">
        <span>LAP TIME: ${currentLapTime}s</span>
        <span style="color:#0ff">BEST LAP: ${bestTime}s</span>
        ${diffStr}
        </div>`;
    }
    this.onResize();
    let raceOver = false;
    if (allRacers.some(r => r.lap > 3)) raceOver = true;
    if (raceOver && this.state !== 'FINISHED') this.finishRace(allRacers);
  }

  drawNetGraph() {
    const netGraph = document.getElementById('net-graph');
    if (this.gameMode !== 'MULTIPLAYER' || this.state === 'MENU') {
      netGraph.style.display = 'none';
      return;
    }
    netGraph.style.display = 'flex';
    
    const delayEl = document.getElementById('net-delay');
    const throughputEl = document.getElementById('net-throughput');
    const canvas = document.getElementById('net-canvas');
    const ctx = canvas.getContext('2d');
    
    const m = this.network.metrics;
    delayEl.innerText = `DELAY: ${Math.round(m.delay)}ms`;
    throughputEl.innerText = `RATE: ${(m.throughputIn / 1024).toFixed(1)} KB/s IN / ${(m.throughputOut / 1024).toFixed(1)} KB/s OUT`;
    
    // Update graph data
    this.netGraphData.push(m.delay);
    if (this.netGraphData.length > 80) this.netGraphData.shift();
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#0ff';
    ctx.lineWidth = 1;
    ctx.beginPath();
    const maxVal = 200; // max scale 200ms
    for (let i = 0; i < this.netGraphData.length; i++) {
      const x = (i / 80) * canvas.width;
      const y = canvas.height - (Math.min(maxVal, this.netGraphData[i]) / maxVal) * canvas.height;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  
  finishRace(rankedRacers) {
    this.state = 'FINISHED'; const points = [10, 8, 6, 5, 4, 3, 2, 1, 0]; let playerRank = 1;
    audioEngine.stopEngine();
    rankedRacers.forEach((racer, idx) => { this.campaignScores[racer.pilot.id] += points[idx] || 0; if (racer.isPlayer) playerRank = idx + 1; });
    
    let earnedCredits = 0;
    if (this.gameMode !== 'TIME_TRIAL') {
       earnedCredits = (points[playerRank-1] || 0) * 10;
       this.credits += earnedCredits;
    } else {
       earnedCredits = 10; // Participation credits for time trial
       this.credits += earnedCredits;
       
       const totalTime = performance.now() - this.lapStartTime;
       if (!this.bestLaps[this.mapType] || totalTime < this.bestLaps[this.mapType].time) {
         // Downsample the ghost array to save memory in localStorage (1 out of every 5 frames)
         const downsampledPath = this.currentGhostLap.filter((_, i) => i % 5 === 0);
         this.bestLaps[this.mapType] = { time: totalTime, path: downsampledPath };
       }
    }
    if (this.gameMode === 'CAMPAIGN') {
      this.campaignTrackIndex++;
      const pilotData = this.getPilotData(this.playerPilotId);
      pilotData.campaign.trackIndex = this.campaignTrackIndex;
      pilotData.campaign.scores = this.campaignScores;
    }
    this.saveData();

    if (this.gameMode === 'MULTIPLAYER') {
      setTimeout(() => {
        // Reset ready status for next race
        for (let id in this.network.players) {
          this.network.players[id].ready = false;
        }
        this.updateLobbyUI();
        this.state = 'LOBBY';
      }, 5000); // Give 5 seconds to see results
    } else {
      this.showScreen('game-over');
    }
    document.getElementById('go-title').innerText = playerRank === 1 ? "VICTORY!" : "RACE FINISHED";
    
    let lapStats = "LAP TIMES:\n";
    let ghostLapTimes = [];
    if (this.gameMode === 'TIME_TRIAL' && this.recordedGhost) {
      // Extract lap times from ghost path
      for (let lap = 1; lap <= 3; lap++) {
        let f1 = null, f2 = null;
        for (let i = 0; i < this.recordedGhost.length - 1; i++) {
          if (this.recordedGhost[i].lp <= lap && this.recordedGhost[i+1].lp > lap) {
            f1 = this.recordedGhost[i]; f2 = this.recordedGhost[i+1]; break;
          }
        }
        if (f1 && f2) {
          const factor = (lap - f1.lp) / (f2.lp - f1.lp);
          const timeAtLapEnd = f1.time + (f2.time - f1.time) * factor;
          const prevTime = ghostLapTimes.length > 0 ? ghostLapTimes.reduce((a,b) => a+b, 0) : 0;
          ghostLapTimes.push(timeAtLapEnd - prevTime);
        }
      }
    }

    this.player.lapTimes.forEach((t, i) => {
      let diffStr = "";
      if (this.gameMode === 'TIME_TRIAL' && ghostLapTimes[i]) {
        const diff = (t - ghostLapTimes[i]) / 1000;
        const color = diff <= 0 ? "#0f0" : "#f00";
        diffStr = ` <span style="color:${color}">(${diff <= 0 ? '' : '+'}${diff.toFixed(2)}s)</span>`;
      }
      lapStats += `LAP ${i+1}: ${(t/1000).toFixed(2)}s${diffStr}\n`;
    });

    let statsText = `YOU FINISHED IN POSITION #${playerRank}\n\n${lapStats}\nCREDITS EARNED: ${earnedCredits}\nTOTAL CREDITS: ${this.credits}`;
    if (this.gameMode === 'TIME_TRIAL') {
      const isNewBest = this.bestLaps[this.mapType] && this.bestLaps[this.mapType].path === this.currentGhostLap;
      statsText = `TIME TRIAL FINISHED\nTIME: ${((performance.now() - this.lapStartTime) / 1000).toFixed(2)}s\n` + 
                  `${lapStats}\n` +
                  (isNewBest ? "NEW BEST TIME!" : "") + `\nCREDITS EARNED: ${earnedCredits}\nTOTAL CREDITS: ${this.credits}`;
    }
    document.getElementById('go-stats').innerHTML = statsText.replace(/\n/g, '<br>');
    this.onResize();
  }
  
  update(dt) {
    if (this.state === 'PAUSED') {
      this.pollGamepads();
      return;
    }
    if (this.state === 'RACING' || this.state === 'FINISHED' || this.state === 'STARTING') {
      if (this.state === 'RACING' || this.state === 'STARTING') this.pollGamepads();
      this.track.update(dt, this.camera);
      
      let allRacers = [];
      if (this.gameMode === 'MULTIPLAYER') {
        allRacers = (this.player ? [this.player] : []).concat(Object.values(this.mpPlayers)).concat(this.ais);
      } else {
        allRacers = this.player ? [this.player, ...this.ais] : [];
      }
      
      const spawnFn = (type, owner) => this.weaponSystem.spawn(type, owner);

      if (this.isMobile && this.state === 'RACING') this.inputs.accelerate = true;

      if (this.inputs.accelerate) this.currentThrottle = Math.min(1.0, this.currentThrottle + dt * 1.5);
      else this.currentThrottle = Math.max(0.0, this.currentThrottle - dt * 2.0);

      if (this.state === 'STARTING') {
        const prevSec = Math.ceil(this.countdownTimer);
        if (this.gameMode !== 'MULTIPLAYER' || this.network.isHost) {
          this.countdownTimer -= dt;
        }
        const currSec = Math.ceil(this.countdownTimer);
        const msg = document.getElementById('message-display');
        if (msg) {
          if (prevSec !== currSec && currSec > 0) {
            msg.innerText = currSec;
          } else if (msg.innerText === "" && currSec > 0) {
            msg.innerText = currSec; // Fallback initialization
          }
        }
      }

      if (this.state === 'RACING' || this.state === 'STARTING') {
        if (this.gameMode === 'MULTIPLAYER' && !this.network.isHost) {
          this.network.sendInput(this.inputs);
          
          if (this.player) this.player.update(0, this.track, { accelerate: false }, allRacers, spawnFn);
          for (const ai of this.ais) {
            if (ai) ai.update(0, this.track, this.player, allRacers, spawnFn);
          }
        } else {
          // Host or Single Player
          if (this.state === 'RACING') {
            if (this.player) this.player.update(dt, this.track, this.inputs, allRacers, spawnFn);
            
            if (this.gameMode === 'MULTIPLAYER' && this.network.isHost) {
              for (let id in this.remoteInputs) {
                if (this.mpPlayers[id] && id !== this.network.myId) {
                  this.mpPlayers[id].update(dt, this.track, this.remoteInputs[id], allRacers, spawnFn);
                }
              }
            }
            
            for (const ai of this.ais) {
              if (ai) ai.update(dt, this.track, this.player, allRacers, spawnFn);
            }
            this.updateRanks(allRacers);
          } else {
            // Starting state
            if (this.player) this.player.update(0, this.track, { accelerate: false }, allRacers, spawnFn);
            if (this.gameMode === 'MULTIPLAYER' && this.network.isHost) {
              for (let id in this.remoteInputs) {
                if (this.mpPlayers[id] && id !== this.network.myId) {
                  this.mpPlayers[id].update(0, this.track, { accelerate: false }, allRacers, spawnFn);
                }
              }
            }
            for (const ai of this.ais) {
              if (ai) ai.update(0, this.track, this.player, allRacers, spawnFn);
            }

            if (this.countdownTimer <= 0) {
              this.state = 'RACING';
              this.lapStartTime = performance.now();
              this.currentLapStartTime = this.lapStartTime;
              if (this.player) {
                this.player._lapStartTime = this.lapStartTime;
                this.player._lastRecordedLap = 1;
              }
              this.ais.forEach(ai => { 
                if (ai) { ai._lapStartTime = this.lapStartTime; ai._lastRecordedLap = 1; }
              });
              
              const isPerfect = this.currentThrottle >= 0.8 && this.currentThrottle <= 0.9;
              const isGood = this.currentThrottle > 0.5 && !isPerfect;

              const msg = document.getElementById('message-display');
              if (msg) {
                msg.innerText = "GO!"; 
                if (isPerfect) {
                  msg.innerHTML = "GO!<br><span style='color:#ff0; font-size:2rem;'>PERFECT START!!</span>";
                  const speedMult = DIFFICULTY_SETTINGS[this.difficulty].speedMultiplier;
                  if (this.player) { 
                    this.player.speed = 280 * speedMult; 
                    this.player.bonusSpeed = 100; 
                  }
                  } else if (isGood) {
                  msg.innerHTML = "GO!<br><span style='color:#0ff; font-size:1.5rem;'>GOOD START</span>";
                  const speedMult = DIFFICULTY_SETTINGS[this.difficulty].speedMultiplier;
                  if (this.player) { this.player.speed = 140 * speedMult; }
                }
                setTimeout(() => { if (msg.innerText.startsWith("GO")) msg.innerText = ""; }, 1000);
              }
            }
          }

          if (this.state === 'RACING') {
            const now = performance.now();
            allRacers.forEach(r => {
              if (r.lap > r._lastRecordedLap) {
                const time = now - r._lapStartTime;
                r.lapTimes.push(time);
                r.totalTime = r.lapTimes.reduce((a, b) => a + b, 0);
                r._lapStartTime = now;
                r._lastRecordedLap = r.lap;
                if (r === this.player) this.onPlayerLapComplete(time, r.lap - 1);
              }
            });
          }

          if (this.gameMode === 'MULTIPLAYER' && this.network.isHost) {
            const now = performance.now();
            const syncTimetable = (now - this.lastTimetableSync) > 1000;
            if (syncTimetable) this.lastTimetableSync = now;

            const state = { 
              mp: {}, 
              ai: [],
              st: this.state,
              ct: this.countdownTimer,
              rt: this.state === 'RACING' ? (now - this.lapStartTime) : 0
            };
            for (let id in this.mpPlayers) {
              const v = this.mpPlayers[id];
              if (v) {
                state.mp[id] = { t: v.t, a: v.angle, s: v.speed, sf: v.sideFactor, r: v.rank, l: v.lap };
                if (syncTimetable) {
                  state.mp[id].lt = v.lapTimes;
                  state.mp[id].tt = v.lap > 1 ? v.lapTimes.reduce((a,b)=>a+b,0) : 0;
                }
              }
            }
            this.ais.forEach(ai => {
              if (ai) {
                const aiState = { p: ai.pilot.id, t: ai.t, a: ai.angle, s: ai.speed, sf: ai.sideFactor, r: ai.rank, l: ai.lap };
                if (syncTimetable) {
                  aiState.lt = ai.lapTimes;
                  aiState.tt = ai.lap > 1 ? ai.lapTimes.reduce((a,b)=>a+b,0) : 0;
                }
                state.ai.push(aiState);
              }
            });
            this.network.broadcastGameState(state);
          }
        }

        this.weaponSystem.update(dt, allRacers);
        if (this.player.cameraShakeRequest > 0) { this.cameraShakeIntensity = Math.max(this.cameraShakeIntensity, this.player.cameraShakeRequest); this.player.cameraShakeRequest = 0; }
        
        // Ghost Logic
        if (this.gameMode === 'TIME_TRIAL') {
          const timeSinceStart = performance.now() - this.lapStartTime;
          this.currentGhostLap.push({ time: timeSinceStart, lp: this.player.lapProgress, angle: this.player.angle, sideFactor: this.player.sideFactor });
          
          this.ghostDiffTimer -= dt;
          if (this.ghostDiffTimer <= 0) {
            this.ghostDiffTimer = 1.0;
            this.ghostTimeDiff = null;
            if (this.recordedGhost && this.recordedGhost.length > 1) {
              // Find ghost frames surrounding player's current lapProgress (lp)
              let f1 = null, f2 = null;
              for (let i = 0; i < this.recordedGhost.length - 1; i++) {
                const lp1 = this.recordedGhost[i].lp !== undefined ? this.recordedGhost[i].lp : this.recordedGhost[i].t;
                const lp2 = this.recordedGhost[i+1].lp !== undefined ? this.recordedGhost[i+1].lp : this.recordedGhost[i+1].t;
                // Note: old 't' data doesn't account for laps, so this will only work for lap 1
                if (lp1 <= this.player.lapProgress && lp2 > this.player.lapProgress) {
                  f1 = this.recordedGhost[i]; f2 = this.recordedGhost[i+1]; break;
                }
              }
              if (f1 && f2) {
                const lp1 = f1.lp !== undefined ? f1.lp : f1.t;
                const lp2 = f2.lp !== undefined ? f2.lp : f2.t;
                const factor = (this.player.lapProgress - lp1) / (lp2 - lp1);
                const ghostTimeAtLP = f1.time + (f2.time - f1.time) * factor;
                this.ghostTimeDiff = (ghostTimeAtLP - timeSinceStart) / 1000;
              }
            }
          }

          const totalTimeSinceRaceStart = performance.now() - this.lapStartTime;
          if (this.ghostMesh && this.recordedGhost && this.recordedGhost.length > 0) {
            const lastG = this.recordedGhost[this.recordedGhost.length - 1];
            // Fallback to old 't' if 'lp' is missing (migration support)
            const lastT = lastG.lp !== undefined ? lastG.lp % 1.0 : lastG.t;
            let ghostFrame = { t: lastT, angle: lastG.angle, sideFactor: lastG.sideFactor };
            
            for (let i = 0; i < this.recordedGhost.length - 1; i++) {
              if (this.recordedGhost[i].time <= totalTimeSinceRaceStart && this.recordedGhost[i+1].time > totalTimeSinceRaceStart) {
                const t1 = this.recordedGhost[i], t2 = this.recordedGhost[i+1];
                const factor = (totalTimeSinceRaceStart - t1.time) / (t2.time - t1.time);
                
                let tInterpolated = 0;
                if (t1.lp !== undefined && t2.lp !== undefined) {
                  tInterpolated = (t1.lp + (t2.lp - t1.lp) * factor) % 1.0;
                } else {
                  // Fallback for old 't' data
                  let t_a = t1.t, t_b = t2.t;
                  if (t_b < t_a) t_b += 1.0; // Handle lap wrapping
                  tInterpolated = (t_a + (t_b - t_a) * factor) % 1.0;
                }

                ghostFrame = {
                  t: tInterpolated, 
                  angle: t1.angle + (t2.angle - t1.angle) * factor,
                  sideFactor: t1.sideFactor + (t2.sideFactor - t1.sideFactor) * factor
                };
                break;
              }
            }
            if (ghostFrame.t !== undefined && !isNaN(ghostFrame.t)) {
              const frame = this.track.getFrameAt(ghostFrame.t);
              const normal = new THREE.Vector3().copy(frame.normal).applyAxisAngle(frame.tangent, ghostFrame.angle);
              const r = this.track.radius + (ghostFrame.sideFactor * 3.5);
              this.ghostMesh.position.copy(frame.point).add(normal.multiplyScalar(r));
              const m = new THREE.Matrix4(); m.lookAt(new THREE.Vector3(), frame.tangent, normal);
              this.ghostMesh.quaternion.setFromRotationMatrix(m);
            }
          }
        }
        
      } else if (this.state === 'FINISHED') {
        this.player.update(dt, this.track, { accelerate: false, brake: true }, allRacers, spawnFn);
        for (const ai of this.ais) ai.update(dt, this.track, this.player, allRacers, spawnFn);
        this.weaponSystem.update(dt, allRacers);
      }
      const speedFactor = this.player ? Math.max(0, (this.player.speed - this.player.maxSpeed * 0.5) / (this.player.maxSpeed * 0.8)) : 0;
      this.chromaticEffect.offset.set(speedFactor * GAME_CONFIG.CHROMATIC_ABERRATION_MAX, speedFactor * GAME_CONFIG.CHROMATIC_ABERRATION_MAX);
      this.camera.fov = GAME_CONFIG.CAMERA_FOV_BASE + speedFactor * GAME_CONFIG.CAMERA_FOV_EXTRA; this.camera.updateProjectionMatrix();
      const tOffset = this.inputs.rearView ? 0.005 : -0.001;
      const camFrame = this.track.getFrameAt(this.player.t + tOffset); 
      const targetCamPos = new THREE.Vector3().copy(camFrame.point);
      const camNormal = new THREE.Vector3().copy(camFrame.normal).applyAxisAngle(camFrame.tangent, this.player.angle);
      let camR = this.track.radius + (this.player.sideFactor * GAME_CONFIG.CAMERA_DISTANCE_Y); targetCamPos.add(camNormal.multiplyScalar(camR));
      let lookT = this.inputs.rearView ? -0.05 : 0.02;
      const lookFrame = this.track.getFrameAt(this.player.t + lookT);
      const lookPos = new THREE.Vector3().copy(lookFrame.point);
      const lookNormal = new THREE.Vector3().copy(lookFrame.normal).applyAxisAngle(lookFrame.tangent, this.player.angle);
      let lookR = this.track.radius + (this.player.sideFactor * GAME_CONFIG.CAMERA_LOOK_OFFSET_Y); lookPos.add(lookNormal.multiplyScalar(lookR));
      if (this.state === 'STARTING') {
        const progress = 1.0 - Math.max(0, this.countdownTimer / this.countdownTotal), ease = 1.0 - Math.pow(1.0 - progress, 3);
        this.camera.position.lerpVectors(this.startCamPos, targetCamPos, ease);
        this.camera.lookAt(lookPos); this.camera.up.lerp(this.player.mesh.up, ease);
      } else {
        this.camera.position.copy(targetCamPos); this.camera.up.lerp(this.player.mesh.up, GAME_CONFIG.CAMERA_LERP_FACTOR);
        if (this.cameraShakeIntensity > 0) {
          this.cameraShakeIntensity -= dt * 2.0;
          const shake = new THREE.Vector3((Math.random() - 0.5) * this.cameraShakeIntensity * 2.0, (Math.random() - 0.5) * this.cameraShakeIntensity * 2.0, (Math.random() - 0.5) * this.cameraShakeIntensity * 2.0);
          this.camera.position.add(shake);
        }
        this.camera.lookAt(lookPos);
      }
      if (this.player) audioEngine.updateEngine(this.player.speed / this.player.maxSpeed);
      this.updateHUD();
      this.inputs.switch = false;
    } else {
      if (this.track && this.ais && this.ais.length > 0) {
        this.track.update(dt, this.camera);
        const spawnFn = (type, owner) => this.weaponSystem.spawn(type, owner);
        for (const ai of this.ais) ai.update(dt, this.track, this.ais[0], this.ais, spawnFn);
        this.weaponSystem.update(dt, this.ais);

        this.attractCamT = (this.attractCamT || 0) + dt * 0.2;
        
        // Find the lead AI
        let leadAi = this.ais[0];
        for (const ai of this.ais) {
          if (ai.lapProgress > leadAi.lapProgress) leadAi = ai;
        }

        const camFrame = this.track.getFrameAt(leadAi.t - 0.015);
        const lookFrame = this.track.getFrameAt(leadAi.t + 0.05);
        const camPos = new THREE.Vector3().copy(camFrame.point);
        const lookPos = new THREE.Vector3().copy(lookFrame.point);
        
        const normal = new THREE.Vector3().copy(camFrame.normal).applyAxisAngle(camFrame.tangent, leadAi.angle + Math.sin(this.attractCamT) * 2.0);
        const radiusOffset = this.track.radius + 15 + Math.cos(this.attractCamT * 1.5) * 8;
        camPos.add(normal.multiplyScalar(radiusOffset));
        
        this.camera.position.lerp(camPos, 0.05);
        this.camera.lookAt(lookPos);
        const upNormal = new THREE.Vector3().copy(lookFrame.normal).applyAxisAngle(lookFrame.tangent, leadAi.angle);
        this.camera.up.lerp(upNormal, 0.05);
      } else {
        const time = performance.now() * 0.0005;
        this.camera.position.set(Math.sin(time) * 100, 50, Math.cos(time) * 100); this.camera.lookAt(0,0,0);
      }
    }
  }

  // --- MULTIPLAYER ---
  renderLobbyBrowser(hosts) {
    const list = document.getElementById('lobby-list');
    list.innerHTML = '';
    const hostKeys = Object.keys(hosts);
    if (hostKeys.length === 0) {
      list.innerHTML = '<div style="text-align:center; color:#aaa;">NO HOSTS FOUND</div>';
      return;
    }
    hostKeys.forEach(id => {
      const h = hosts[id];
      const row = document.createElement('div');
      row.style.cssText = 'display:flex; justify-content:space-between; align-items:center; background:#111; padding:10px; border:1px solid #0ff;';
      row.innerHTML = `
        <div>
          <div style="color:#0ff; font-weight:bold;">${h.name}</div>
          <div style="font-size:0.8rem; color:#aaa;">MODE: ${h.mode} | PLAYERS: ${h.players}/${h.maxPlayers}</div>
        </div>
        <button class="main-btn" style="padding: 5px 15px; font-size:1rem;">JOIN</button>
      `;
      row.querySelector('button').addEventListener('click', () => {
        document.getElementById('lobby-list').innerHTML = '<div style="text-align:center; color:#ff0;">JOINING...</div>';
        this.network.joinHost(h.id, PILOTS[this.playerPilotId].name, this.playerPilotId, this.vehicleType);
      });
      list.appendChild(row);
    });
    this.onResize();
  }

  updateLobbyUI() {
    this.showScreen('mp-lobby');
    const list = document.getElementById('lobby-players-list');
    list.innerHTML = '';

    let allReady = true;
    Object.values(this.network.players).forEach(p => {
      const statusColor = p.ready ? '#0f0' : '#f00';
      const statusText = p.ready ? 'READY' : 'WAITING';
      if (!p.ready) allReady = false;

      list.innerHTML += `
        <div style="padding:10px; background:#111; border:1px solid ${statusColor}; color:${statusColor}; display:flex; justify-content:space-between; align-items:center;">
          <span>${p.name} (Pilot: ${PILOTS[p.pilotId].name}) ${p.isHost ? '[HOST]' : ''}</span>
          <span style="font-weight:bold; font-size:0.8rem;">${statusText}</span>
        </div>
      `;
    });

    const config = this.network.hostConfig;
    document.getElementById('lobby-config-info').innerHTML = `
      <div style="color:#0ff; font-weight:bold; margin-bottom:5px;">RACE CONFIGURATION</div>
      <div style="color:#0ff;">MODE: ${config.mode}</div>
      <div style="color:#0ff;">TRACK: ${MAPS[config.mapIndex].name}</div>
      <div style="color:#0ff;">DIFFICULTY: ${DIFFICULTY_SETTINGS[config.difficulty].name}</div>
      <div style="color:#0ff;">AI RACERS: ${config.useAI ? 'ON' : 'OFF'}</div>
    `;

    const hostControls = document.getElementById('host-lobby-controls');
    const startBtn = document.getElementById('btn-lobby-start');
    const readyBtn = document.getElementById('btn-lobby-ready');

    const myPlayer = this.network.players[this.network.myId];
    if (myPlayer) {
      readyBtn.innerText = myPlayer.ready ? 'CANCEL READY' : 'READY UP';
      readyBtn.style.color = myPlayer.ready ? '#f00' : '#ff0';
      readyBtn.style.borderColor = myPlayer.ready ? '#f00' : '#ff0';
    }

    if (this.network.isHost) {
      hostControls.style.display = 'flex';
      startBtn.style.display = 'block';
      startBtn.disabled = !allReady;
      startBtn.style.opacity = allReady ? '1' : '0.5';

      // Sync UI to model (in case of re-entry)
      document.getElementById('lobby-mode').value = config.mode;
      document.getElementById('lobby-track').value = config.mapIndex;
      document.getElementById('lobby-diff').value = config.difficulty;
      document.getElementById('lobby-ai').checked = config.useAI;
      document.getElementById('lobby-track-row').style.display = (config.mode === 'SINGLE' ? 'flex' : 'none');
    } else {
      hostControls.style.display = 'none';
      startBtn.style.display = 'none';
    }
    this.onResize();
  }
  startMultiplayerRace(players, config) {
    this.gameMode = 'MULTIPLAYER';
    this.mapType = config.mapIndex;
    this.difficulty = config.difficulty;
    this.startCamPos.copy(this.camera.position); this.state = 'STARTING'; this.countdownTimer = this.countdownTotal; this.showScreen('hud');
    audioEngine.startEngine();
    const hudPic = document.getElementById('hud-pilot-pic'); hudPic.innerHTML = `<img src="${PILOTS[this.playerPilotId].portrait}">`;
    while(this.scene.children.length > 0) this.scene.remove(this.scene.children[0]); 
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5); ambientLight.layers.enable(1); this.scene.add(ambientLight);
    const sunLight = new THREE.DirectionalLight(0xffffff, 1); sunLight.position.set(100, 100, 50); sunLight.layers.enable(1); this.scene.add(sunLight);
    this.track = new Track(this.scene, this.mapType);
    this.weaponSystem = new WeaponSystem(this.scene, this.track);
    
    this.remoteInputs = {};
    this.mpPlayers = {}; 
    this.ais = [];

    // Sort player IDs to ensure consistent grid positions across all clients
    const sortedPlayerIds = Object.keys(players).sort();
    
    sortedPlayerIds.forEach((id, idx) => {
      const p = players[id];
      const isLocal = id === this.network.myId;
      const upg = { speed: 0, handling: 0, armor: 0 }; 
      const v = new Vehicle(this.scene, p.vehicleId, isLocal, PILOTS[p.pilotId], upg);
      v.isHuman = true;
      v.minimapMarker.layers.set(1);
      
      // Assign starting position
      v.t = 0.01 - (idx * 0.003);
      v.angle = (idx % 2 === 0 ? -0.4 : 0.4);
      v.lapProgress = v.t;

      if (isLocal) {
        this.player = v;
      } else {
        this.remoteInputs[id] = { accelerate: false, brake: false, left: false, right: false, fire: false, boost: false };
      }
      this.mpPlayers[id] = v;
    });

    if (config.useAI) {
      const humanPilotIds = Object.values(players).map(pl => pl.pilotId);
      let aiGridIdx = sortedPlayerIds.length;
      
      PILOTS.forEach(p => { 
        if (!humanPilotIds.includes(p.id)) {
          const ai = new AI(this.scene, config.difficulty, p);
          ai.minimapMarker.layers.set(1);
          
          // Assign starting position for AI
          ai.t = 0.01 - (aiGridIdx * 0.003);
          ai.angle = (aiGridIdx % 2 === 0 ? -0.4 : 0.4);
          ai.lapProgress = ai.t;
          
          this.ais.push(ai);
          aiGridIdx++;
        }
      });
    }

    const skyGeo = new THREE.SphereGeometry(5000, 32, 32);
    const skyMat = textureManager.getBasicMaterial(MAPS[this.mapType].bgWords, { side: THREE.BackSide, fog: false });
    const sky = new THREE.Mesh(skyGeo, skyMat); this.scene.add(sky);
    
    // Initialize countdown display
    const msg = document.getElementById('message-display');
    if (msg) msg.innerText = "3";
    
    audioEngine.setMode('race', this.mapType, config.difficulty); audioEngine.start(); this.runCountdown();
  }

  applyNetworkState(state) {
    if (this.state !== 'RACING' && this.state !== 'STARTING' && this.state !== 'FINISHED') return;
    
    // Sync Game State
    if (state.st && this.state !== state.st) {
      const oldState = this.state;
      this.state = state.st;
      if (oldState === 'STARTING' && this.state === 'RACING') {
        const msg = document.getElementById('message-display');
        if (msg) {
          msg.innerText = "GO!";
          setTimeout(() => { if (msg.innerText === "GO!") msg.innerText = ""; }, 1000);
        }
        this.lapStartTime = performance.now() - (state.rt || 0);
      }
    }

    if (this.state === 'STARTING' && state.ct !== undefined) {
      const prevSec = Math.ceil(this.countdownTimer);
      this.countdownTimer = state.ct;
      const currSec = Math.ceil(this.countdownTimer);
      const msg = document.getElementById('message-display');
      if (msg && prevSec !== currSec && currSec > 0) {
        msg.innerText = currSec;
      }
    }

    if (this.state === 'RACING' && state.rt !== undefined) {
      // Periodic sync of race clock to avoid drift
      this.lapStartTime = performance.now() - state.rt;
    }

    const allRacers = (this.player ? [this.player] : []).concat(Object.values(this.mpPlayers)).concat(this.ais);

    if (state.mp) {
      for (let id in state.mp) {
        if (this.mpPlayers[id]) {
          const s = state.mp[id];
          const v = this.mpPlayers[id];
          v.t = s.t; v.angle = s.a; v.speed = s.s; v.sideFactor = s.sf; v.rank = s.r; v.lap = s.l;
          if (s.lt) v.lapTimes = s.lt;
          if (s.tt !== undefined) v.totalTime = s.tt;
          v.update(0, this.track, {accelerate: false}, allRacers, () => {}); 
        }
      }
    }
    if (state.ai) {
      state.ai.forEach((s, i) => {
        if (!this.ais[i]) {
          this.ais[i] = new AI(this.scene, this.difficulty, PILOTS[s.p]); 
          this.ais[i].minimapMarker.layers.set(1);
        }
        const ai = this.ais[i];
        ai.t = s.t; ai.angle = s.a; ai.speed = s.s; ai.sideFactor = s.sf; ai.rank = s.r; ai.lap = s.l;
        if (s.lt) ai.lapTimes = s.lt;
        if (s.tt !== undefined) ai.totalTime = s.tt;
        ai.update(0, this.track, null, allRacers, () => {}); 
      });
    }
  }

  loop() {
    if (this.clock.update) this.clock.update();
    const dt = this.clock.getDelta(); this.update(Math.min(dt, 0.1)); 
    this.renderer.setViewport(0, 0, window.innerWidth, window.innerHeight); this.renderer.setScissorTest(false); this.composer.render();
    this.drawNetGraph();
    const trackSelect = document.getElementById('track-select'); const isMapSelect = trackSelect.classList.contains('active');
    const carSelect = document.getElementById('car-select'); const isCarSelect = carSelect.classList.contains('active');
    const isRacing = (this.state === 'RACING' || this.state === 'FINISHED' || this.state === 'STARTING');
    if ((isMapSelect || isRacing || isCarSelect) && this.state !== 'PAUSED') {
      const mapSize = Math.min(window.innerWidth, window.innerHeight) * (isMapSelect || isCarSelect ? 0.4 : 0.25);
      const margin = 20, statsHeight = (isMapSelect || isCarSelect) ? 0 : 220;
      const x = (isMapSelect || isCarSelect) ? (window.innerWidth - mapSize - 50) : margin;
      const y = (isMapSelect || isCarSelect) ? (window.innerHeight / 2 - mapSize / 2) : (margin + statsHeight);
      this.renderer.setViewport(x, y, mapSize, mapSize); this.renderer.setScissor(x, y, mapSize, mapSize); this.renderer.setScissorTest(true); 
      this.renderer.setClearColor(0x000000, 1);
      this.renderer.clear();
      
      if (isCarSelect) { 
        this.minimapCamera.position.set(0, 20, 40); 
        this.minimapCamera.lookAt(0, 0, 0); 
        if (this.previewVehicle) this.previewVehicle.mesh.rotation.y += dt * 0.5;
        if (this.previewLights) this.previewLights.rotation.y -= dt;
      } else if (isMapSelect) { 
        this.minimapCamera.position.set(0, 12000, 0); 
        this.minimapCamera.lookAt(0, 0, 0); 
      } else { 
        this.minimapCamera.position.set(0, 8000, 0); 
        this.minimapCamera.lookAt(0, 0, 0); 
      }

      this.renderer.render(this.scene, this.minimapCamera);
      this.renderer.setScissorTest(false);

    }
    requestAnimationFrame(() => this.loop());
  }
}
new Game();
