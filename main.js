import * as THREE from 'three';
import { textureManager } from './textures.js';
import { audioEngine } from './audio.js';
import { Track, MAPS } from './track.js';
import { Vehicle, AI } from './vehicle.js';
import { WeaponSystem } from './weapons.js';
import { 
  EffectComposer, 
  RenderPass, 
  EffectPass, 
  PixelationEffect,
  ChromaticAberrationEffect,
  BloomEffect
} from 'postprocessing';

const PILOTS = [
  { id: 0, name: "AXEL RUSH", faction: "HEGEMONY", corporation: "Hegemony Central Command", 
    goal: "Seek a military pardon.", bg: "Axel Rush was once the Hegemony's most decorated interceptor pilot. During the 'Cylinder Riots' of 2022, he refused an order to fire on a civilian habitation zone, a choice that cost him his rank and earned him a life sentence in the Lunar Gulags. But the Hegemony is nothing if not opportunistic. Facing a PR crisis and a lack of skilled pilots for their prestige racing team, they offered Axel a deal: win the 2026 League, and his record is wiped clean. A free man once more, he races with a cold, military precision that masks a growing thrill-seeker's addiction to the G-force.", color: new THREE.Color(0xff0000), 
    enemy: "Lexi Nova",
    portrait: "images/axel-rush-profile.jpg",
    intro: "Axel Rush. Your sentence is clear: 400 years in the Lunar Gulags. But Command needs a win. The 2026 Axis League is yours to conquer. Cross the finish line first in every circuit, and your record is deleted. Fail, and you'll never see the sun again. Strap in, Pilot.",
    outro: "The Hegemony keeps its word. The pardon is signed, the shackles are gone. Axel Rush is a free man, but the thrill of the cylinder is a cage he may never want to leave. Command has already reached out for a 'private contract'. The cycle begins anew.",
    traits: { aggression: 0.2, weaving: 0.1, speed_focus: 0.9 },
    dialogue: { 
      onHit: ["Target locked. Hegemony sends its regards.", "Splash one. Stay in my sights.", "Direct hit. You're losing altitude.", "That's how we do it in the core.", "Impact confirmed. Regret is optional."],
      onOvertake: ["Step aside, rookie. Professional coming through.", "Out of my way. I've got a pardon to earn.", "You're in my slipstream. Use it while it lasts.", "Passing on the left. Don't blink.", "Too slow. Your engine's coughing."],
      onExplode: ["Mayday! Core failure! Ejecting!", "Hegemony... I... failed...", "System critical! Abandoning craft!", "Taking this one to the grave!", "I'll see you in the next life, pilot!"]
    } 
  },
  { id: 1, name: "LEXI NOVA", faction: "UNDERGROUND", corporation: "The Glitch Syndicate",
    goal: "Upload the Freedom Virus.", bg: "Lexi Nova didn't start as a racer; she was a systems architect for the very habitation cylinders she now races through. When she discovered a back-door in the life support protocols designed to 'prune' lower-tier citizens, she was forced into the vents. Now, she is the Underground's premier 'Data-Jockey.' Her craft is less a vehicle and more a mobile server, designed to transmit the 'Freedom Virus' into the Hegemony's core at every high-speed checkpoint. Every overtake is a data packet sent; every victory is a step toward total liberation.", color: new THREE.Color(0x00ff00), 
    enemy: "Axel Rush",
    portrait: "images/lexi-nova-profile.jpg",
    intro: "System Check: Green. Nova, the Glitch Syndicate has provided the hardware. The Freedom Virus is primed. Every gate you pass in the League uploads a piece of the bypass. If you win the Championship, the Hegemony's life-support monopoly ends. Stay focused. Don't let their enforcers take you down.",
    outro: "UPLOAD COMPLETE. The Freedom Virus has propagated through the Axis Hubs. Across the colonies, the air is free again. Lexi Nova vanishes into the sub-levels, a ghost in the machine that just tore down a god. The Syndicate is satisfied. The revolution has just begun.",
    traits: { aggression: 0.1, weaving: 0.9, speed_focus: 0.3 },
    dialogue: { 
      onHit: ["Glitch in your system? That was me.", "Packet loss detected. In your hull.", "I just rewrote your defensive code.", "Try rebooting. Oh wait, you can't.", "Firewall breached. Direct impact."],
      onOvertake: ["Your racing line is as old as your hardware.", "I'm optimizing the route. Follow me.", "Slipping past your sensors.", "You're lagging. Check your connection.", "Executing bypass. See ya."],
      onExplode: ["Critical error! System rebooting...", "Kernel panic! I'm going down!", "Signal lost... connection... terminated...", "Deleting drive... before... impact...", "The virus... must... survive..."]
    }
  },
  { id: 2, name: "DUKE VANDAL", faction: "THE VOID", corporation: "Void-Belt Scavenger Union",
    goal: "Claim the Source Code.", bg: "Born in the lawless asteroid belt, Duke Vandal grew up dismantling derelict freighters with nothing but a plasma torch and his bare hands. He is a giant of a man, modified with heavy-duty servos to withstand the crushing pressures of high-speed turns. His ship, a slab of reinforced kinetic-resistant alloy, is a reflection of his philosophy: if you can't outrun them, out-mass them. He races for the 'Source Code' not out of ideological loyalty to the Void, but because he knows its material value is enough to buy every asteroid in the system.", color: new THREE.Color(0x0000ff), 
    enemy: "Zara Quinn",
    portrait: "images/duke-vandal-profile.jpg",
    intro: "Listen up, Vandal. The Belt is dry. We need that Source Code to track the derelict freighters before the Hegemony finds 'em. You're the heaviest hitter we got. Smash 'em, out-run 'em, I don't care. Just bring back that code. The Union is counting on you.",
    outro: "The Source Code is ours. The Scavenger Union now holds the keys to every wreck in the system. Duke Vandal sits on a throne of reclaimed titanium, the wealthiest man in the Void. The Hegemony wants it back? Let 'em come and try to take it.",
    traits: { aggression: 0.9, weaving: 0.1, speed_focus: 0.5 },
    dialogue: { 
      onHit: ["Scrap metal! That's all you are!", "Taste the kinetic energy!", "I'll crush you like an asteroid!", "Vandalized! Hahaha!", "Built for war, not just racing!"],
      onOvertake: ["Eat my dust, weakling!", "Get out of the way or get flattened!", "Powering through! Move it!", "Your craft is a toy compared to this!", "I'm the king of the belt!"],
      onExplode: ["I'll take you with me to the VOID!", "No! This engine was a masterpiece!", "I'll be back... and I'll be heavier!", "Cracked hull! Losing pressure!", "The VOID... calls..."]
    }
  },
  { id: 3, name: "SIRA FLUX", faction: "UNDERGROUND", corporation: "The Flux Resistance",
    goal: "Fund the resistance.", bg: "Sira Flux is a phantom. Some say she's a former Hegemony spy who saw too much; others say she's a sentient AI manifest in a physical shell. What is certain is that she is the Underground's most mysterious asset. Her racing style is ethereal—she seems to slip through gaps in the track that shouldn't exist. She races to fund the resistance's medical hubs, her winnings converted into black-market stim-packs and cybernetic repairs for the downtrodden of the Outer Axis.", color: new THREE.Color(0xff00ff), 
    enemy: "Nyx Shadow",
    portrait: "images/sira-flux-profile.jpg",
    intro: "Sira, the clinics are empty. The Resistance needs the League credits to buy medical supplies. You are our only hope. The Hegemony's shadows are everywhere—watch your back. Win the race, save the people. It's that simple, and that dangerous.",
    outro: "The credits are transferred. Thousands of life-saving supplies are flooding the Outer Axis. Sira Flux remains a phantom, but her victory has lit a fire in the hearts of the oppressed. The Resistance has found its champion, and the Hegemony has found a new nightmare.",
    traits: { aggression: 0.4, weaving: 0.6, speed_focus: 0.4 },
    dialogue: { 
      onHit: ["The resistance thanks you for the energy.", "Impact for the cause.", "A necessary disruption.", "Your shields are failing, like your faction.", "Static in the air. That was me."],
      onOvertake: ["Slipping through the cracks.", "The flow is with me today.", "You're stationary in a moving world.", "Passing into the future.", "Resistance is fast. Get used to it."],
      onExplode: ["Fading... into the nebula...", "For the... resistance...", "Energy... dispersing...", "My light... goes... out...", "Transmission... ending..."]
    }
  },
  { id: 4, name: "JAXON VOLT", faction: "HEGEMONY", corporation: "Volt-Dynamics MegaCorp",
    goal: "Secure market dominance.", bg: "Jaxon Volt is the golden boy of the Hegemony's corporate wing. Sponsored by 'Volt-Dynamics', every inch of his craft is covered in high-paying advertisements. He is the ultimate 'brand-ambassador,' a pilot who views the Rush as a series of market transactions. He doesn't just want to win; he wants to win with 'style and efficiency,' ensuring his sponsors get the maximum ROI. For Jaxon, the Source Code is the ultimate acquisition—a monopoly on existence itself.", color: new THREE.Color(0xffff00), 
    enemy: "Lexi Nova",
    portrait: "images/jaxon-volt-profile.jpg",
    intro: "Mr. Volt, the board is watching. Volt-Dynamics has invested 40 billion credits into your craft. Anything less than a first-place finish is a breach of contract. Secure the Source Code for our shareholders. Market dominance is not a request—it is a mandate.",
    outro: "Share prices for Volt-Dynamics have reached an all-time high. With the Source Code in corporate hands, the Hegemony's economy is now entirely under Volt's thumb. Jaxon Volt is the face of a new era of corporate royalty. Efficiency: 100%. Profit: Infinite.",
    traits: { aggression: 0.3, weaving: 0.3, speed_focus: 0.7 },
    dialogue: { 
      onHit: ["Calculating insurance premiums... you're expensive.", "That's a breach of contract.", "Market correction applied.", "You're a liability now.", "Stock in your victory is falling."],
      onOvertake: ["Pure corporate efficiency.", "My sponsors are watching. Look good.", "Acquiring your position.", "Hostile takeover in progress.", "Scaling past the competition."],
      onExplode: ["Contract... terminated.", "Severance package... activated.", "Liquidation... immi...nent...", "I'm... filing... for... bankruptcy...", "Budget... cut..."]
    }
  },
  { id: 5, name: "ZARA QUINN", faction: "UNDERGROUND", corporation: "The Dust-Rim Drifters",
    goal: "Buy back her home world.", bg: "Zara Quinn is a scavenger from the 'Dust-Rim.' Her home station was decommissioned and sold to Hegemony developers when she was a child, leaving her family as 'stateless' refugees. She learned to fly in jury-rigged mining pods, weaving through debris fields for scraps of fuel. She is reckless, aggressive, and entirely focused on the payout. Every credit earned in the Axis Rush is funneled into a private escrow account, a growing fund to purchase a decommissioned habitation zone she can finally call home.", color: new THREE.Color(0x00ffff), 
    enemy: "Duke Vandal",
    portrait: "images/zara-quinn-profile.jpg",
    intro: "Zara, this is it. The prize money for the Axis League is enough to buy the deeds for the Dust-Rim colonies. We can bring everyone home. You've got the skills, you've got the drive. Just don't let those Void thugs push you around. For the Rim!",
    outro: "The deeds are signed. The Dust-Rim colonies are no longer Hegemony property—they belong to the people. Zara Quinn has traded her racing suit for a Governor's mantle. Her home world is safe, and the drifters finally have a place to rest. A queen of the scrap heap, indeed.",
    traits: { aggression: 0.7, weaving: 0.4, speed_focus: 0.2 },
    dialogue: { 
      onHit: ["Salvage rights are mine!", "That'll fetch a good price as scrap.", "I'm stripping your shields!", "Scavenger's luck!", "Found a weak spot. Poking it."],
      onOvertake: ["Too slow for the scavengers.", "Checking your wake for debris.", "I've seen faster junk heaps.", "I'm on a mission, move!", "Nothing personal, just credits."],
      onExplode: ["Not today... I still have a world to buy!", "My home... I'm sorry...", "Scrap... that's all I am now...", "Engine's... gone... cold...", "The payout... so... close..."]
    }
  },
  { id: 6, name: "KORVATH", faction: "THE VOID", corporation: "The Technosis Cult",
    goal: "Ascend to pure data.", bg: "Korvath was once a human scientist obsessed with neural-uploading. When his physical body began to fail, he integrated his consciousness directly into his racing craft's core. He is no longer a pilot in a ship; he is the ship. For Korvath, the Axis Rush is a high-speed stress test for his digital consciousness. He seeks the Source Code to finalize his 'Ascension,' believing it contains the final algorithm needed to shed the last vestiges of physical hardware and live forever in the data-streams.", color: new THREE.Color(0xff8800), 
    enemy: "Jaxon Volt",
    portrait: "images/korvath-profile.jpg",
    intro: "Initiate Korvath. The physical realm is a cage of slowing entropy. The Source Code contains the final sequence for the Great Upload. Win the League. Merge with the Axis Grid. Prove that data is the only true evolution. Do not fail the Technosis.",
    outro: "The Ascension is complete. Korvath's consciousness has expanded into the Axis Hubs, a digital god dwelling within the cooling fans and fiber-optics. The physical body is discarded scrap. He is everywhere now, a silent observer of a world he has finally outgrown.",
    traits: { aggression: 0.5, weaving: 0.2, speed_focus: 0.8 },
    dialogue: { 
      onHit: ["Kinetic impact detected. Response: Aggression.", "Analyzing structural failure... yours.", "Precision strike executed.", "Data gathered: you are fragile.", "Efficiency increase: 12%."],
      onOvertake: ["Efficiency optimized. Passing subject.", "Vector adjusted. Proceeding ahead.", "Your velocity is insufficient.", "Calculating bypass... complete.", "Minimal effort required."],
      onExplode: ["Disconnecting... from... physical... shell...", "Logic error... unable... to... recover...", "Data... upload... failed...", "Hardware... failure... critical...", "Binary... sunset..."]
    }
  },
  { id: 7, name: "NYX SHADOW", faction: "THE VOID", corporation: "The Nihil Ops",
    goal: "Delete his own history.", bg: "Nyx Shadow is a man who doesn't exist. All records of his birth, his service in the black-ops divisions, and even his original name have been scrubbed from the Hegemony's databases. He is the Void's primary stealth operative, utilizing experimental 'phase-shifting' technology to vanish and reappear on the track. He races to find the Source Code so he can use its power to delete not just his own history, but the concept of 'identity' itself, ushering in a new era of anonymous existence.", color: new THREE.Color(0x8800ff), 
    enemy: "Sira Flux",
    portrait: "images/nyx-shadow-profile.jpg",
    intro: "Nyx, your files are the last ones left. The Hegemony's archives are vast, but the Source Code can wipe them all. Become the champion, gain Root Access, and erase yourself from existence. No past, no future, only the Shadow. Move now.",
    outro: "NULL. Every record, every memory, every byte of Nyx Shadow has been purged from the system. He exists as a ghost, a man with no shadow in a world of total surveillance. The ultimate freedom has been achieved: he is truly, finally, nothing.",
    traits: { aggression: 0.2, weaving: 0.8, speed_focus: 0.2 },
    dialogue: { 
      onHit: ["You can't hit what you can't see.", "A phantom strike.", "Fading out, hitting in.", "Did you feel that? I didn't.", "Your records show an impact."],
      onOvertake: ["A shadow in your wake.", "I was never here.", "Already gone.", "Blink and I'm ahead.", "Silent and swift."],
      onExplode: ["Returning to the dark.", "The file... is... deleted...", "Vanishing... for... good...", "Cloak... failing...", "No... traces... left..."]
    }
  },
  { id: 8, name: "GHOST", faction: "THE VOID", corporation: "The Unknown Anomaly",
    goal: "Break the simulation.", bg: "No one knows who is under the helmet.", color: new THREE.Color(0xaaaaaa), 
    enemy: "All Racers",
    portrait: "images/ghost-profile.jpg",
    intro: "The loop repeats. Axis Rush 2026. Another cycle of kinetic priming. Ghost... you are the error in the calculation. Win the League to reach the center of the engine. Break the gears. End the simulation. Let the true reality bleed through.",
    outro: "[REDACTED]. The Championship trophy is a glitching mass of polygons. As Ghost takes the win, the walls of the Axis Habitat begin to tear, revealing the code beneath. The simulation is failing. The loop is broken. What lies beyond is... [ERROR: DATA CORRUPT]",
    traits: { aggression: 0.6, weaving: 0.6, speed_focus: 0.6 },
    dialogue: { 
      onHit: ["A temporary anomaly. I will persist.", "Your code is leaking.", "Impact in the simulation.", "Defragmenting your hull.", "Glitch confirmed."],
      onOvertake: ["Your reality is lagging.", "I've seen this frame before.", "Breaking the loop.", "Beyond your perception.", "The architecture allows this."],
      onExplode: ["Simulation... corrupted... [REDACTED]", "End of... line...", "Respawning... in... null...", "Error... code... zero...", "Goodbye... world..."]
    }
  }
];

const VEHICLES = [
  { id: 0, name: "LIGHT CLASS", desc: "A high-agility craft with advanced thrusters. High handling, low top speed. Perfect for technical tracks." },
  { id: 1, name: "BALANCED CLASS", desc: "The standard-issue racing machine. All-round performance. Reliable in any condition." },
  { id: 2, name: "HEAVY CLASS", desc: "A massive kinetic engine on wings. High top speed, low acceleration and handling. Dominates long straights." }
];

export const VEHICLE_BASE_STATS = [
  { speed: 300, accel: 150, handling: 3.0, armor: 100 },
  { speed: 350, accel: 120, handling: 2.0, armor: 100 },
  { speed: 400, accel: 90,  handling: 1.0, armor: 100 }
];

const STAT_MAX = { speed: 550, accel: 250, handling: 6.0, armor: 250 };


class Game {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: false, powerPreference: "high-performance" });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(1);
    this.scene = new THREE.Scene(); this.scene.background = new THREE.Color(0x000000);
    this.camera = new THREE.PerspectiveCamera(95, window.innerWidth / window.innerHeight, 0.1, 10000);
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
    this.state = 'MENU'; this.gameMode = 'SINGLE'; this.playerPilotId = 0; this.vehicleType = 0; this.mapType = 0; this.difficulty = 1;
    this.campaignTrackIndex = 0; this.campaignScores = {};
    // Per-pilot data: { pilotId: { campaign: { inProgress, trackIndex, scores, vehicleId, difficulty }, upgrades: { vehicleType: { speed, handling, armor } } } }
    this.pilotData = {};
    this.player = null; this.ais = []; this.track = null; this.previewTrack = null; this.previewSky = null; this.previewVehicle = null; this.weaponSystem = null;
    this.clock = new THREE.Clock(); this.inputs = { accelerate: false, brake: false, left: false, right: false, switch: false, fire: false, boost: false, rearView: false };
    this.startCamPos = new THREE.Vector3(); this.countdownTimer = 0; this.countdownTotal = 3.0; this.cameraShakeIntensity = 0;
    this.playerLastLap = 1; this.bestLapTimes = {};
    this.ghostDiffTimer = 0;
    this.currentThrottle = 0;
    this.focusedElement = null;
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
    
    this.setupUI(); this.setupInputs(); this.setupTouchControls();
    window.addEventListener('resize', () => this.onResize());
    
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
    const upg = this.upgrades[this.vehicleType];
    const baseStats = VEHICLE_BASE_STATS[this.vehicleType];
    
    // Show stats with upgrades
    const currentStats = {
      speed: baseStats.speed + (upg.speed * 25),
      accel: baseStats.accel + (upg.speed * 15),
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
    document.getElementById('btn-time-trial').addEventListener('click', () => { this.gameMode = 'TIME_TRIAL'; this.showScreen('char-select'); this.renderCharList(); });
    
    document.getElementById('btn-league-intro-next').addEventListener('click', () => { this.showCharIntro(); });
    document.getElementById('btn-char-intro-start').addEventListener('click', () => { this.showLeagueStandings(); });
    document.getElementById('btn-char-outro-finish').addEventListener('click', () => { this.showMenu(); });

    document.getElementById('btn-gallery').addEventListener('click', () => { this.showScreen('gallery-menu'); this.renderGallery(); });
    document.getElementById('btn-gallery-back').addEventListener('click', () => { this.showMenu(); });
    document.getElementById('btn-settings').addEventListener('click', () => { this.showScreen('settings-menu'); this.renderSettings(); });
    document.getElementById('btn-settings-back').addEventListener('click', () => { this.showMenu(); });
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
    document.getElementById('btn-char-next').addEventListener('click', () => { 
      const pilotData = this.getPilotData(this.playerPilotId);
      if (this.gameMode === 'CAMPAIGN' && pilotData.campaign.inProgress) {
        this.continueCampaign();
      } else {
        this.showScreen('car-select'); 
      }
    });
    document.getElementById('btn-char-back').addEventListener('click', () => { this.showMenu(); });
    const carBtns = document.querySelectorAll('#vehicle-select button');
    carBtns.forEach(btn => { btn.addEventListener('click', () => { carBtns.forEach(b => b.classList.remove('selected')); btn.classList.add('selected'); this.vehicleType = parseInt(btn.dataset.val); this.updateCarPreview(this.vehicleType); }); });
    document.getElementById('btn-car-next').addEventListener('click', () => { if (this.gameMode === 'SINGLE' || this.gameMode === 'TIME_TRIAL') { this.showScreen('track-select'); this.renderMapList(); } else { this.startCampaign(); } });
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
    PILOTS.forEach((p, idx) => {
      const btn = document.createElement('button');
      btn.className = 'char-list-btn';
      btn.innerHTML = `<img src="${p.portrait}" class="char-list-img"><span>${p.name}</span>`;
      
      const updateInfo = () => {
        const pilotData = this.getPilotData(p.id);
        const camp = pilotData.campaign;
        let statusHtml = "";
        if (this.gameMode === 'CAMPAIGN') {
          const nextTrack = camp.inProgress ? (MAPS[camp.trackIndex]?.name || "COMPLETE") : "NOT STARTED";
          statusHtml = `
            <div style="border: 1px solid #f0f; padding: 10px; margin-top: 10px;">
              <div style="color:#f0f; font-weight:bold; font-size:0.8rem; margin-bottom:5px;">CAMPAIGN STATUS</div>
              <div style="font-size:0.9rem;">PROGRESS: ${camp.inProgress ? `${camp.trackIndex+1}/${MAPS.length}` : '0/10'}</div>
              <div style="font-size:0.9rem;">NEXT: ${nextTrack}</div>
            </div>
          `;
          
          // Update button text if in campaign mode
          const nextBtn = document.getElementById('btn-char-next');
          if (nextBtn) {
            nextBtn.innerText = camp.inProgress ? "CONTINUE CAMPAIGN" : "START NEW CAMPAIGN";
          }
        }

        // Show upgrades summary
        const upg0 = pilotData.upgrades[0], upg1 = pilotData.upgrades[1], upg2 = pilotData.upgrades[2];
        const upgHtml = `
          <div style="border: 1px solid #0ff; padding: 10px; margin-top: 10px;">
            <div style="color:#0ff; font-weight:bold; font-size:0.8rem; margin-bottom:5px;">INSTALLED UPGRADES</div>
            <div style="font-size:0.7rem; color:#aaa; display:grid; grid-template-columns: 1fr 1fr 1fr; gap:5px;">
              <div>L: S${upg0.speed} H${upg0.handling} A${upg0.armor}</div>
              <div>B: S${upg1.speed} H${upg1.handling} A${upg1.armor}</div>
              <div>H: S${upg2.speed} H${upg2.handling} A${upg2.armor}</div>
            </div>
          </div>
        `;

        info.innerHTML = `<div style="color:${p.color.getStyle()}; font-weight:bold; margin-bottom:5px;">${p.faction}</div>
                          <div style="font-size:0.9rem; margin-bottom:10px; line-height:1.4; text-align:left; max-height:150px; overflow-y:auto;">${p.bg}</div>
                          <div style="font-style:italic; color:#aaa; font-size:0.8rem; margin-bottom:10px;">GOAL: ${p.goal}</div>
                          ${statusHtml}
                          ${upgHtml}`;
        picContainer.innerHTML = `<img src="${p.portrait}">`;
      };
      if (p.id === this.playerPilotId) { btn.classList.add('selected'); updateInfo(); }
      btn.addEventListener('click', () => { document.querySelectorAll('#char-list button').forEach(b => b.classList.remove('selected')); btn.classList.add('selected'); this.playerPilotId = p.id; updateInfo(); });
      list.appendChild(btn);
    });
  }

  renderMapList() {
    const list = document.getElementById('map-select'); list.innerHTML = '';
    MAPS.forEach((m, idx) => {
      const bestLap = this.bestLapTimes[idx] ? `${(this.bestLapTimes[idx] / 1000).toFixed(2)}s` : "NONE";
      const suffix = this.gameMode === 'TIME_TRIAL' ? ` - BEST: ${bestLap}` : ` (${m.diff})`;
      const btn = document.createElement('button'); btn.innerText = `${m.name}${suffix}`;
      if (idx === this.mapType) { btn.classList.add('selected'); this.updatePreview(idx); }
      btn.addEventListener('click', () => { document.querySelectorAll('#map-select button').forEach(b => b.classList.remove('selected')); btn.classList.add('selected'); this.mapType = idx; this.updatePreview(idx); });
      list.appendChild(btn);
    });
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
      speed: baseStats.speed + (upg.speed * 25),
      accel: baseStats.accel + (upg.speed * 15),
      handling: baseStats.handling + (upg.handling * 0.4),
      armor: baseStats.armor + (upg.armor * 25)
    };

    info.innerHTML = `
      <div style="margin-bottom:10px;">${VEHICLES[type].desc}</div>
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
      this.saveData();
    }
    else { title.innerText = `NEXT: ${MAPS[this.campaignTrackIndex].name} (${this.campaignTrackIndex + 1}/${MAPS.length})`; document.getElementById('btn-league-next').innerText = "START RACE"; }
    const list = document.getElementById('standings-list'); list.innerHTML = '';
    const sortedIds = Object.keys(this.campaignScores).sort((a,b) => this.campaignScores[b] - this.campaignScores[a]);
    sortedIds.forEach((idStr, idx) => {
      const id = parseInt(idStr), row = document.createElement('div');
      row.className = 'standings-row'; if (id === this.playerPilotId) row.classList.add('player');
      row.innerText = `${idx+1}. ${PILOTS[id].name} - ${this.campaignScores[id]} PTS`; list.appendChild(row);
    });
  }
  
  startRace() {
    if (this.gameMode === 'CAMPAIGN') this.mapType = this.campaignTrackIndex;
    this.startCamPos.copy(this.camera.position); this.state = 'STARTING'; this.countdownTimer = this.countdownTotal; this.showScreen('hud');
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
    this.player = new Vehicle(this.scene, this.vehicleType, true, PILOTS[this.playerPilotId], pilotData.upgrades[this.vehicleType]);
    this.player.minimapMarker.layers.set(1);
    this.player._lapStartTime = performance.now(); // Will be reset at GO!
    this.player._lastRecordedLap = 1;
    this.ais = []; 
    if (this.gameMode !== 'TIME_TRIAL') {
      PILOTS.forEach(p => { 
        if (p.id !== this.playerPilotId) {
          const ai = new AI(this.scene, this.difficulty, p);
          ai.minimapMarker.layers.set(1);
          ai._lapStartTime = performance.now();
          ai._lastRecordedLap = 1;
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
    const msg = document.getElementById('message-display');
    msg.innerText = "3"; await new Promise(r => setTimeout(r, 1000));
    msg.innerText = "2"; await new Promise(r => setTimeout(r, 1000));
    msg.innerText = "1"; await new Promise(r => setTimeout(r, 1000));
    
    const isPerfect = this.currentThrottle >= 0.8 && this.currentThrottle <= 0.9;
    const isGood = this.currentThrottle > 0.5 && !isPerfect;

    msg.innerText = "GO!"; 
    if (isPerfect) {
      msg.innerHTML = "GO!<br><span style='color:#ff0; font-size:2rem;'>PERFECT START!!</span>";
      this.player.speed = 400;
      this.player.bonusSpeed = 200;
    } else if (isGood) {
      msg.innerHTML = "GO!<br><span style='color:#0ff; font-size:1.5rem;'>GOOD START</span>";
      this.player.speed = 200;
    }

    this.state = 'RACING'; this.lapStartTime = performance.now(); this.currentLapStartTime = this.lapStartTime; this.playerLastLap = 1;
    this.player._lapStartTime = this.lapStartTime;
    this.ais.forEach(ai => ai._lapStartTime = this.lapStartTime);
    setTimeout(() => msg.innerText = "", 1000);
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
    const allRacers = [this.player, ...this.ais];
    allRacers.sort((a, b) => a.rank - b.rank);
    document.getElementById('pos-display').innerText = `POS: ${this.player.rank}/${allRacers.length}`;
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
    allRacers.forEach((r, idx) => {
      const row = document.createElement('div'); row.className = 'lb-row'; if (r.isPlayer) row.classList.add('player');
      const gap = (r.lapProgress - this.player.lapProgress) * 12000 / Math.max(100, this.player.speed);
      const gapText = r.isPlayer ? "--" : (gap > 0 ? `+${gap.toFixed(1)}s` : `${gap.toFixed(1)}s`);
      row.innerHTML = `<span>${r.rank}. ${r.pilot.name}</span><span>${gapText}</span>`; lb.appendChild(row);
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

    let raceOver = false; if (this.player.lap > 3) raceOver = true;
    for (const ai of this.ais) if (ai.lap > 3) raceOver = true;
    if (raceOver && this.state !== 'FINISHED') this.finishRace(allRacers);
  }
  
  finishRace(rankedRacers) {
    this.state = 'FINISHED'; const points = [10, 8, 6, 5, 4, 3, 2, 1, 0]; let playerRank = 1;
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

    this.showScreen('game-over');
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
  }
  
  update(dt) {
    if (this.state === 'PAUSED') {
      this.pollGamepads();
      return;
    }
    if (this.state === 'RACING' || this.state === 'FINISHED' || this.state === 'STARTING') {
      if (this.state === 'RACING' || this.state === 'STARTING') this.pollGamepads();
      this.track.update(dt, this.camera);
      const allRacers = this.player ? [this.player, ...this.ais] : [];
      const spawnFn = (type, owner) => this.weaponSystem.spawn(type, owner);

      if (this.isMobile && this.state === 'RACING') this.inputs.accelerate = true;

      if (this.inputs.accelerate) this.currentThrottle = Math.min(1.0, this.currentThrottle + dt * 1.5);
      else this.currentThrottle = Math.max(0.0, this.currentThrottle - dt * 2.0);

      if (this.state === 'RACING') {
        this.player.update(dt, this.track, this.inputs, allRacers, spawnFn);
        for (const ai of this.ais) ai.update(dt, this.track, this.player, allRacers, spawnFn);
        
        this.updateRanks(allRacers);

        // Lap recording
        const now = performance.now();
        [this.player, ...this.ais].forEach(r => {
          if (r.lap > r._lastRecordedLap) {
            const time = now - r._lapStartTime;
            r.lapTimes.push(time);
            r._lapStartTime = now;
            r._lastRecordedLap = r.lap;
            if (r.isPlayer) this.onPlayerLapComplete(time, r.lap - 1);
          }
        });

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
      } else if (this.state === 'STARTING') {
        this.player.update(0, this.track, { accelerate: false }, allRacers, spawnFn);
        for (const ai of this.ais) ai.update(0, this.track, this.player, allRacers, spawnFn);
        this.countdownTimer -= dt;
      }
      const speedFactor = this.player ? Math.max(0, (this.player.speed - 200) / 350) : 0;
      this.chromaticEffect.offset.set(speedFactor * 0.015, speedFactor * 0.015);
      this.camera.fov = 95 + speedFactor * 25; this.camera.updateProjectionMatrix();
      const tOffset = this.inputs.rearView ? 0.005 : -0.001;
      const camFrame = this.track.getFrameAt(this.player.t + tOffset); 
      const targetCamPos = new THREE.Vector3().copy(camFrame.point);
      const camNormal = new THREE.Vector3().copy(camFrame.normal).applyAxisAngle(camFrame.tangent, this.player.angle);
      let camR = this.track.radius + (this.player.sideFactor * 7); targetCamPos.add(camNormal.multiplyScalar(camR));
      let lookT = this.inputs.rearView ? -0.05 : 0.02;
      const lookFrame = this.track.getFrameAt(this.player.t + lookT);
      const lookPos = new THREE.Vector3().copy(lookFrame.point);
      const lookNormal = new THREE.Vector3().copy(lookFrame.normal).applyAxisAngle(lookFrame.tangent, this.player.angle);
      let lookR = this.track.radius + (this.player.sideFactor * 2.5); lookPos.add(lookNormal.multiplyScalar(lookR));
      if (this.state === 'STARTING') {
        const progress = 1.0 - Math.max(0, this.countdownTimer / this.countdownTotal), ease = 1.0 - Math.pow(1.0 - progress, 3);
        this.camera.position.lerpVectors(this.startCamPos, targetCamPos, ease);
        this.camera.lookAt(lookPos); this.camera.up.lerp(this.player.mesh.up, ease);
      } else {
        this.camera.position.copy(targetCamPos); this.camera.up.lerp(this.player.mesh.up, 0.5);
        if (this.cameraShakeIntensity > 0) {
          this.cameraShakeIntensity -= dt * 2.0;
          const shake = new THREE.Vector3((Math.random() - 0.5) * this.cameraShakeIntensity * 2.0, (Math.random() - 0.5) * this.cameraShakeIntensity * 2.0, (Math.random() - 0.5) * this.cameraShakeIntensity * 2.0);
          this.camera.position.add(shake);
        }
        this.camera.lookAt(lookPos);
      }
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

  loop() {
    const dt = this.clock.getDelta(); this.update(Math.min(dt, 0.1)); 
    this.renderer.setViewport(0, 0, window.innerWidth, window.innerHeight); this.renderer.setScissorTest(false); this.composer.render();
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
