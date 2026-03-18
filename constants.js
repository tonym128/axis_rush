import * as THREE from 'three';

// --- GAMEPLAY CONFIGURATION ---
export const GAME_CONFIG = {
  // Speed & Physics
  TRACK_TOTAL_LENGTH: 12000,
  BRAKE_MULTIPLIER: 1.5,
  COAST_MULTIPLIER: 0.5,
  TURN_SPEED_LOSS: 0.02,
  STEERING_ACCEL_MULT: 10.0,
  STEERING_FRICTION: 4.0,
  MAX_ANGULAR_VELOCITY: 2.0,
  SIDE_TRANSITION_SPEED: 4.0,
  
  // Boost & Energy
  BOOST_DECAY: 75,
  BOOST_ENERGY_CONSUMPTION: 20,
  MANUAL_BOOST_MIN_BONUS: 75,
  SLIPSTREAM_MULTIPLIER: 1.1,
  BOOST_PAD_BONUS_SPEED: 150,
  BOOST_PAD_INSTANT_SPEED: 100,
  RECHARGE_RATE: 50,
  
  // Damage & Recovery
  DAMAGE_COLLISION_VEHICLE: 5,
  DAMAGE_COLLISION_OBSTACLE: 20,
  RESPAWN_TIME: 3.0,
  RESPAWN_INVULNERABILITY: 5.0,
  HIT_INVULNERABILITY: 1.0,
  SHIELD_FLASH_DURATION: 0.5,
  
  // Items & Track
  TRACK_RADIUS: 20,
  TRACK_SEGMENTS: 400,
  TRACK_RADIAL_SEGMENTS: 16,
  ITEM_COOLDOWN: 5.0,
  COLLISION_T_TOLERANCE: 0.02,
  
  // Visuals & Camera
  TRAIL_MAX_POINTS: 40,
  TRAIL_OPACITY_BASE: 0.7,
  CAMERA_FOV_BASE: 95,
  CAMERA_FOV_EXTRA: 25,
  CAMERA_DISTANCE_Y: 7,
  CAMERA_LOOK_OFFSET_Y: 2.5,
  CAMERA_LERP_FACTOR: 0.5,
  CHROMATIC_ABERRATION_MAX: 0.015,
  COUNTDOWN_DURATION: 3.0,
  
  // Weapons
  MISSILE_SPEED_BONUS: 140,
  MISSILE_LIFE: 5.0,
  MISSILE_DAMAGE: 30,
  HAZARD_LIFE: 15.0,
  HAZARD_DAMAGE: 15,
  OIL_SPIN_FORCE: 10,
  
  // AI
  AI_BASE_REACTION: 0.4,
  AI_DIFFICULTY_REACTION_STEP: 0.1,
  AI_PAD_DETECTION_DIST: 0.08,
  AI_OBSTACLE_DETECTION_DIST: 0.04
};

export const DIFFICULTY_SETTINGS = {
  0: { // NOVICE
    name: "NOVICE",
    speedMultiplier: 0.8,
    damageMultiplier: 0.5,
    energyRegen: 1.5,
    aiDiffMult: [0.7, 0.8, 0.9]
  },
  1: { // PRO
    name: "PRO",
    speedMultiplier: 1.0,
    damageMultiplier: 1.0,
    energyRegen: 1.0,
    aiDiffMult: [0.85, 1.0, 1.15]
  },
  2: { // ELITE
    name: "ELITE",
    speedMultiplier: 1.25,
    damageMultiplier: 1.5,
    energyRegen: 0.7,
    aiDiffMult: [1.0, 1.2, 1.4]
  }
};

export const PILOTS = [
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

export const VEHICLES = [
  { id: 0, name: "LIGHT CLASS", desc: "A high-agility craft with advanced thrusters. High handling, low top speed. Perfect for technical tracks." },
  { id: 1, name: "BALANCED CLASS", desc: "The standard-issue racing machine. All-round performance. Reliable in any condition." },
  { id: 2, name: "HEAVY CLASS", desc: "A massive kinetic engine on wings. High top speed, low acceleration and handling. Dominates long straights." }
];

export const VEHICLE_BASE_STATS = [
  { speed: 237.5, accel: 120, handling: 4.0, armor: 125 },
  { speed: 250,   accel: 90,  handling: 3.0, armor: 175 },
  { speed: 262.5, accel: 60,  handling: 2.0, armor: 225 }
];

export const STAT_MAX = { speed: 500, accel: 180, handling: 6.0, armor: 350 };
