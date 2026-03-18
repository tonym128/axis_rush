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
  TOTAL_LAPS: 3,
  
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
    outros: {
      rank1: "The Hegemony keeps its word. The pardon is signed, the shackles are gone. Axel Rush is a free man, but the thrill of the cylinder is a cage he may never want to leave. Command has already reached out for a 'private contract'. The cycle begins anew.",
      rank3: "While not a total victory, the Hegemony is impressed by your skill. Your sentence is commuted to 'Extended Community Service' on the racing circuit. You're no longer a prisoner, but a professional asset with a bright, high-speed future.",
      rankElse: "The mission was a partial success. The Hegemony grants you a conditional release for your cooperation. You're back in the sub-levels, but you're free. The roar of the engines still calls to you, and next season, you'll be ready."
    },
    traits: { aggression: 0.2, weaving: 0.1, speed_focus: 0.9 },
    dialogue: { 
      onHit: ["Target locked. Hegemony sends its regards.", "Splash one. Stay in my sights.", "Direct hit. You're losing altitude.", "That's how we do it in the core.", "Impact confirmed. Regret is optional."],
      onOvertake: ["Step aside, rookie. Professional coming through.", "Out of my way. I've got a pardon to earn.", "You're in my slipstream. Use it while it lasts.", "Passing on the left. Don't blink.", "Too slow. Your engine's coughing."],
      onExplode: ["Mayday! Core failure! Ejecting!", "Hegemony... I... failed...", "System critical! Abandoning craft!", "Taking this one to the grave!", "I'll see you in the next life, pilot!"],
      onCollide: ["Watch your spacing, pilot!", "Don't scratch the hull. Command is watching.", "Maintain formation or get out of the way.", "Check your six. You're drifting.", "Aggressive maneuvers? Not on my watch."]
    } 
  },
  { id: 1, name: "LEXI NOVA", faction: "UNDERGROUND", corporation: "The Glitch Syndicate",
    goal: "Upload the Freedom Virus.", bg: "Lexi Nova didn't start as a racer; she was a systems architect for the very habitation cylinders she now races through. When she discovered a back-door in the life support protocols designed to 'prune' lower-tier citizens, she was forced into the vents. Now, she is the Underground's premier 'Data-Jockey.' Her craft is less a vehicle and more a mobile server, designed to transmit the 'Freedom Virus' into the Hegemony's core at every high-speed checkpoint. Every overtake is a data packet sent; every victory is a step toward total liberation.", color: new THREE.Color(0x00ff00), 
    enemy: "Axel Rush",
    portrait: "images/lexi-nova-profile.jpg",
    intro: "System Check: Green. Nova, the Glitch Syndicate has provided the hardware. The Freedom Virus is primed. Every gate you pass in the League uploads a piece of the bypass. If you win the Championship, the Hegemony's life-support monopoly ends. Stay focused. Don't let their enforcers take you down.",
    outros: {
      rank1: "UPLOAD COMPLETE. The Freedom Virus has propagated through the Axis Hubs. Across the colonies, the air is free again. Lexi Nova vanishes into the sub-levels, a ghost in the machine that just tore down a god. The Syndicate is satisfied. The revolution has just begun.",
      rank3: "Data packets delivered. The Hegemony's life-support monopoly is severely compromised. It's not a total collapse, but the cracks are showing. Lexi returns to the shadows, her mission a success in spirit. The fire of resistance is lit.",
      rankElse: "The upload was interrupted, but enough data leaked to cause a major system glitch. The Hegemony is busy patching holes while the Underground breathes a little easier. Lexi Nova remains a phantom, waiting for the next strike."
    },
    traits: { aggression: 0.1, weaving: 0.9, speed_focus: 0.3 },
    dialogue: { 
      onHit: ["Glitch in your system? That was me.", "Packet loss detected. In your hull.", "I just rewrote your defensive code.", "Try rebooting. Oh wait, you can't.", "Firewall breached. Direct impact."],
      onOvertake: ["Your racing line is as old as your hardware.", "I'm optimizing the route. Follow me.", "Slipping past your sensors.", "You're lagging. Check your connection.", "Executing bypass. See ya."],
      onExplode: ["Critical error! System rebooting...", "Kernel panic! I'm going down!", "Signal lost... connection... terminated...", "Deleting drive... before... impact...", "The virus... must... survive..."],
      onCollide: ["Hey! You're corrupting my telemetry!", "Watch the hardware!", "Collision detected. My paint job!", "Packet collision! Back off.", "You're interfering with the upload!"]
    }
  },
  { id: 2, name: "DUKE VANDAL", faction: "THE VOID", corporation: "Void-Belt Scavenger Union",
    goal: "Claim the Source Code.", bg: "Born in the lawless asteroid belt, Duke Vandal grew up dismantling derelict freighters with nothing but a plasma torch and his bare hands. He is a giant of a man, modified with heavy-duty servos to withstand the crushing pressures of high-speed turns. His ship, a slab of reinforced kinetic-resistant alloy, is a reflection of his philosophy: if you can't outrun them, out-mass them. He races for the 'Source Code' not out of ideological loyalty to the Void, but because he knows its material value is enough to buy every asteroid in the system.", color: new THREE.Color(0x0000ff), 
    enemy: "Zara Quinn",
    portrait: "images/duke-vandal-profile.jpg",
    intro: "Listen up, Vandal. The Belt is dry. We need that Source Code to track the derelict freighters before the Hegemony finds 'em. You're the heaviest hitter we got. Smash 'em, out-run 'em, I don't care. Just bring back that code. The Union is counting on you.",
    outros: {
      rank1: "The Source Code is ours. The Scavenger Union now holds the keys to every wreck in the system. Duke Vandal sits on a throne of reclaimed titanium, the wealthiest man in the Void. The Hegemony wants it back? Let 'em come and try to take it.",
      rank3: "We didn't get the whole Code, but we got enough fragments to secure the Belt for another decade. Duke Vandal returns a hero to the scavengers. He might not be the king of the Axis yet, but he's the undisputed master of the Void.",
      rankElse: "The big prize slipped away, but the salvage from the season is enough to buy a new fleet for the Union. Duke Vandal laughs off the loss—he's got a fresh ship and a new target. The hunt for the next score has already begun."
    },
    traits: { aggression: 0.9, weaving: 0.1, speed_focus: 0.5 },
    dialogue: { 
      onHit: ["Scrap metal! That's all you are!", "Taste the kinetic energy!", "I'll crush you like an asteroid!", "Vandalized! Hahaha!", "Built for war, not just racing!"],
      onOvertake: ["Eat my dust, weakling!", "Get out of the way or get flattened!", "Powering through! Move it!", "Your craft is a toy compared to this!", "I'm the king of the belt!"],
      onExplode: ["I'll take you with me to the VOID!", "No! This engine was a masterpiece!", "I'll be back... and I'll be heavier!", "Cracked hull! Losing pressure!", "The VOID... calls..."],
      onCollide: ["Out of the way or get flattened!", "You're just a speed bump!", "Move it or lose it!", "MASS WINS every time!", "Like hitting a fly on a windshield!"]
    }
  },
  { id: 3, name: "SIRA FLUX", faction: "UNDERGROUND", corporation: "The Flux Resistance",
    goal: "Fund the resistance.", bg: "Sira Flux is a phantom. Some say she's a former Hegemony spy who saw too much; others say she's a sentient AI manifest in a physical shell. What is certain is that she is the Underground's most mysterious asset. Her racing style is ethereal—she seems to slip through gaps in the track that shouldn't exist. She races to fund the resistance's medical hubs, her winnings converted into black-market stim-packs and cybernetic repairs for the downtrodden of the Outer Axis.", color: new THREE.Color(0xff00ff), 
    enemy: "Nyx Shadow",
    portrait: "images/sira-flux-profile.jpg",
    intro: "Sira, the clinics are empty. The Resistance needs the League credits to buy medical supplies. You are our only hope. The Hegemony's shadows are everywhere—watch your back. Win the race, save the people. It's that simple, and that dangerous.",
    outros: {
      rank1: "The credits are transferred. Thousands of life-saving supplies are flooding the Outer Axis. Sira Flux remains a phantom, but her victory has lit a fire in the hearts of the oppressed. The Resistance has found its champion, and the Hegemony has found a new nightmare.",
      rank3: "The winnings are enough to keep the clinics running for months. It's a victory for the people, even if Sira isn't the champion on the podium. She vanishes back into the nebula, her heart lightened by the lives she's saved today.",
      rankElse: "A modest payout, but every credit counts. The Flux Resistance survives to fight another day. Sira Flux watches the championship ceremony from the vents, already planning the next strike."
    },
    traits: { aggression: 0.4, weaving: 0.6, speed_focus: 0.4 },
    dialogue: { 
      onHit: ["The resistance thanks you for the energy.", "Impact for the cause.", "A necessary disruption.", "Your shields are failing, like your faction.", "Static in the air. That was me."],
      onOvertake: ["Slipping through the cracks.", "The flow is with me today.", "You're stationary in a moving world.", "Passing into the future.", "Resistance is fast. Get used to it."],
      onExplode: ["Fading... into the nebula...", "For the... resistance...", "Energy... dispersing...", "My light... goes... out...", "Transmission... ending..."],
      onCollide: ["Careful, don't disrupt the flow.", "We have a common goal. Don't waste it.", "Disrupting the resistance, are we?", "Stability is key, pilot.", "Watch your vector."]
    }
  },
  { id: 4, name: "JAXON VOLT", faction: "HEGEMONY", corporation: "Volt-Dynamics MegaCorp",
    goal: "Secure market dominance.", bg: "Jaxon Volt is the golden boy of the Hegemony's corporate wing. Sponsored by 'Volt-Dynamics', every inch of his craft is covered in high-paying advertisements. He is the ultimate 'brand-ambassador,' a pilot who views the Rush as a series of market transactions. He doesn't just want to win; he wants to win with 'style and efficiency,' ensuring his sponsors get the maximum ROI. For Jaxon, the Source Code is the ultimate acquisition—a monopoly on existence itself.", color: new THREE.Color(0xffff00), 
    enemy: "Lexi Nova",
    portrait: "images/jaxon-volt-profile.jpg",
    intro: "Mr. Volt, the board is watching. Volt-Dynamics has invested 40 billion credits into your craft. Anything less than a first-place finish is a breach of contract. Secure the Source Code for our shareholders. Market dominance is not a request—it is a mandate.",
    outros: {
      rank1: "Share prices for Volt-Dynamics have reached an all-time high. With the Source Code in corporate hands, the Hegemony's economy is now entirely under Volt's thumb. Jaxon Volt is the face of a new era of corporate royalty. Efficiency: 100%. Profit: Infinite.",
      rank3: "Volt-Dynamics reports a 'successful fiscal year.' While Jaxon didn't take the top spot, the marketing exposure was worth billions. He remains a top-tier asset, his contract renewed with a hefty bonus.",
      rankElse: "A 'learning experience,' according to the board. Jaxon Volt's performance was stable enough to avoid liquidation. He's reassigned to the Outer Rim division, where he'll rebuild his portfolio for the next season."
    },
    traits: { aggression: 0.3, weaving: 0.3, speed_focus: 0.7 },
    dialogue: { 
      onHit: ["Calculating insurance premiums... you're expensive.", "That's a breach of contract.", "Market correction applied.", "You're a liability now.", "Stock in your victory is falling."],
      onOvertake: ["Pure corporate efficiency.", "My sponsors are watching. Look good.", "Acquiring your position.", "Hostile takeover in progress.", "Scaling past the competition."],
      onExplode: ["Contract... terminated.", "Severance package... activated.", "Liquidation... immi...nent...", "I'm... filing... for... bankruptcy...", "Budget... cut..."],
      onCollide: ["That's an insurance liability.", "You're devaluing my assets!", "Market interference detected.", "Keep your distance, low-tier pilot.", "Watch the branding! Do you know how much this paint costs?"]
    }
  },
  { id: 5, name: "ZARA QUINN", faction: "UNDERGROUND", corporation: "The Dust-Rim Drifters",
    goal: "Buy back her home world.", bg: "Zara Quinn is a scavenger from the 'Dust-Rim.' Her home station was decommissioned and sold to Hegemony developers when she was a child, leaving her family as 'stateless' refugees. She learned to fly in jury-rigged mining pods, weaving through debris fields for scraps of fuel. She is reckless, aggressive, and entirely focused on the payout. Every credit earned in the Axis Rush is funneled into a private escrow account, a growing fund to purchase a decommissioned habitation zone she can finally call home.", color: new THREE.Color(0x00ffff), 
    enemy: "Duke Vandal",
    portrait: "images/zara-quinn-profile.jpg",
    intro: "Zara, this is it. The prize money for the Axis League is enough to buy the deeds for the Dust-Rim colonies. We can bring everyone home. You've got the skills, you've got the drive. Just don't let those Void thugs push you around. For the Rim!",
    outros: {
      rank1: "The deeds are signed. The Dust-Rim colonies are no longer Hegemony property—they belong to the people. Zara Quinn has traded her racing suit for a Governor's mantle. Her home world is safe, and the drifters finally have a place to rest. A queen of the scrap heap, indeed.",
      rank3: "The purse isn't enough to buy the whole world, but it's enough to secure the habitation sector. Zara's family has a roof over their heads that isn't leaking air. It's a start. The Dust-Rim has a future, and Zara is its brightest star.",
      rankElse: "We didn't get the deeds, but we got the attention of the system. The Dust-Rim drifters have a new hope, and Zara has a ship that's finally paid off. She's back on the circuit, racing for every scrap until her home is truly free."
    },
    traits: { aggression: 0.7, weaving: 0.4, speed_focus: 0.2 },
    dialogue: { 
      onHit: ["Salvage rights are mine!", "That'll fetch a good price as scrap.", "I'm stripping your shields!", "Scavenger's luck!", "Found a weak spot. Poking it."],
      onOvertake: ["Too slow for the scavengers.", "Checking your wake for debris.", "I've seen faster junk heaps.", "I'm on a mission, move!", "Nothing personal, just credits."],
      onExplode: ["Not today... I still have a world to buy!", "My home... I'm sorry...", "Scrap... that's all I am now...", "Engine's... gone... cold...", "The payout... so... close..."],
      onCollide: ["Hey! Watch the scrap!", "You want a piece of me? Literally?", "Don't scratch the payout!", "I've survived bigger hits in the mines!", "Back off, I'm working here!"]
    }
  },
  { id: 6, name: "KORVATH", faction: "THE VOID", corporation: "The Technosis Cult",
    goal: "Ascend to pure data.", bg: "Korvath was once a human scientist obsessed with neural-uploading. When his physical body began to fail, he integrated his consciousness directly into his racing craft's core. He is no longer a pilot in a ship; he is the ship. For Korvath, the Axis Rush is a high-speed stress test for his digital consciousness. He seeks the Source Code to finalize his 'Ascension,' believing it contains the final algorithm needed to shed the last vestiges of physical hardware and live forever in the data-streams.", color: new THREE.Color(0xff8800), 
    enemy: "Jaxon Volt",
    portrait: "images/korvath-profile.jpg",
    intro: "Initiate Korvath. The physical realm is a cage of slowing entropy. The Source Code contains the final sequence for the Great Upload. Win the League. Merge with the Axis Grid. Prove that data is the only true evolution. Do not fail the Technosis.",
    outros: {
      rank1: "The Ascension is complete. Korvath's consciousness has expanded into the Axis Hubs, a digital god dwelling within the cooling fans and fiber-optics. The physical body is discarded scrap. He is everywhere now, a silent observer of a world he has finally outgrown.",
      rank3: "A partial upload. Korvath exists as a split consciousness, half-entangled with the Axis Grid. He is more than human, but less than a god. He continues to race, seeking the final bytes of data needed to complete his beautiful digital symphony.",
      rankElse: "The neural-link held, but the bandwidth was limited. Korvath remains in his physical shell, but his mind is forever changed by the glimpses of the Great Upload. He is a prophet of the data-stream, preparing for the next season's synchronicity."
    },
    traits: { aggression: 0.5, weaving: 0.2, speed_focus: 0.8 },
    dialogue: { 
      onHit: ["Kinetic impact detected. Response: Aggression.", "Analyzing structural failure... yours.", "Precision strike executed.", "Data gathered: you are fragile.", "Efficiency increase: 12%."],
      onOvertake: ["Efficiency optimized. Passing subject.", "Vector adjusted. Proceeding ahead.", "Your velocity is insufficient.", "Calculating bypass... complete.", "Minimal effort required."],
      onExplode: ["Disconnecting... from... physical... shell...", "Logic error... unable... to... recover...", "Data... upload... failed...", "Hardware... failure... critical...", "Binary... sunset..."],
      onCollide: ["Kinetic interaction suboptimal.", "Structural integrity compromised.", "Analyzing impact vector.", "Unplanned contact detected.", "Data stream interrupted by physical collision."]
    }
  },
  { id: 7, name: "NYX SHADOW", faction: "THE VOID", corporation: "The Nihil Ops",
    goal: "Delete his own history.", bg: "Nyx Shadow is a man who doesn't exist. All records of his birth, his service in the black-ops divisions, and even his original name have been scrubbed from the Hegemony's databases. He is the Void's primary stealth operative, utilizing experimental 'phase-shifting' technology to vanish and reappear on the track. He races to find the Source Code so he can use its power to delete not just his own history, but the concept of 'identity' itself, ushering in a new era of anonymous existence.", color: new THREE.Color(0x8800ff), 
    enemy: "Sira Flux",
    portrait: "images/nyx-shadow-profile.jpg",
    intro: "Nyx, your files are the last ones left. The Hegemony's archives are vast, but the Source Code can wipe them all. Become the champion, gain Root Access, and erase yourself from existence. No past, no future, only the Shadow. Move now.",
    outros: {
      rank1: "NULL. Every record, every memory, every byte of Nyx Shadow has been purged from the system. He exists as a ghost, a man with no shadow in a world of total surveillance. The ultimate freedom has been achieved: he is truly, finally, nothing.",
      rank3: "Most of the files are gone. Nyx Shadow is now a low-priority anomaly rather than a wanted criminal. He can walk the streets of the Axis Hubs without fear of immediate arrest. A shadow among shadows, he enjoys his new, quiet life.",
      rankElse: "The deletion was halted, but his primary records were corrupted beyond repair. Nyx Shadow remains a mystery, a blank page in a world of ink. The search for total silence continues."
    },
    traits: { aggression: 0.2, weaving: 0.8, speed_focus: 0.2 },
    dialogue: { 
      onHit: ["You can't hit what you can't see.", "A phantom strike.", "Fading out, hitting in.", "Did you feel that? I didn't.", "Your records show an impact."],
      onOvertake: ["A shadow in your wake.", "I was never here.", "Already gone.", "Blink and I'm ahead.", "Silent and swift."],
      onExplode: ["Returning to the dark.", "The file... is... deleted...", "Vanishing... for... good...", "Cloak... failing...", "No... traces... left..."],
      onCollide: ["Interaction logged.", "A ripple in the shadow.", "You felt that? I barely did.", "Tactile contact was not part of the plan.", "Visibility increased. Undesirable."]
    }
  },
  { id: 8, name: "GHOST", faction: "THE VOID", corporation: "The Unknown Anomaly",
    goal: "Break the simulation.", bg: "No one knows who is under the helmet.", color: new THREE.Color(0xaaaaaa), 
    enemy: "All Racers",
    portrait: "images/ghost-profile.jpg",
    intro: "The loop repeats. Axis Rush 2026. Another cycle of kinetic priming. Ghost... you are the error in the calculation. Win the League to reach the center of the engine. Break the gears. End the simulation. Let the true reality bleed through.",
    outros: {
      rank1: "[REDACTED]. The Championship trophy is a glitching mass of polygons. As Ghost takes the win, the walls of the Axis Habitat begin to tear, revealing the code beneath. The simulation is failing. The loop is broken. What lies beyond is... [ERROR: DATA CORRUPT]",
      rank3: "The simulation flickers. Ghost remains an unexplained variable in the system. While the loop didn't break, it's definitely unstable. The architecture of reality groans under the weight of his presence. The glitch persists.",
      rankElse: "The system successfully quarantined the anomaly. Ghost is pushed to the edge of the simulation, a flickering light in the distant sectors. He's still here, waiting for the next cycle, a ghost in the machine that will never truly be deleted."
    },
    traits: { aggression: 0.6, weaving: 0.6, speed_focus: 0.6 },
    dialogue: { 
      onHit: ["A temporary anomaly. I will persist.", "Your code is leaking.", "Impact in the simulation.", "Defragmenting your hull.", "Glitch confirmed."],
      onOvertake: ["Your reality is lagging.", "I've seen this frame before.", "Breaking the loop.", "Beyond your perception.", "The architecture allows this."],
      onExplode: ["Simulation... corrupted... [REDACTED]", "End of... line...", "Respawning... in... null...", "Error... code... zero...", "Goodbye... world..."],
      onCollide: ["Collision in the simulation.", "Frame skip! That hurt.", "The architecture is unstable.", "Unplanned physical interaction.", "Recalculating collision box."]
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

export const STORY_DATA = {
  0: { // Axel Rush (Hegemony) - Military Pardon
    tracks: [
      { rank1: "The first seal on your pardon flickers green. Command is silent—their highest praise.", rank3: "\"Satisfactory, Rush. But the Lunar Gulags don't accept 'almost'. Secure the lead.\"", rankElse: "\"Pathetic. Every second you lose is a year added to your sentence. Don't fail again.\"", img: "./images/axel-rush-intro.jpg" },
      { rank1: "You bank through the spiral with military precision. Command notes \"optimal efficiency.\"", rank3: "\"You're weaving, Pilot. Tighten your line. We aren't paying for second-rate theatrics.\"", rankElse: "Warning lights flash. Not on the ship, but on your pardon. It's turning yellow.", img: "./images/axel-rush-intro.jpg" },
      { rank1: "In the silence of the vacuum, you find your rhythm. The derelict freighters are just scenery.", rank3: "A close call. The vacuum nearly claimed your engines. Command is running \"risk assessments.\"", rankElse: "\"Losing focus in the dark? The Void doesn't forgive, and neither does the Hegemony.\"", img: "./images/axel-rush-intro.jpg" },
      { rank1: "You navigate the graveyard of steel like a ghost. You helped build these pipes during your sentence.", rank3: "You scrape a bulkhead. The hull groans. Command sends a repair bill to your escrow.", rankElse: "Bogged down in debris. Command is already vetting replacement pilots.", img: "./images/axel-rush-intro.jpg" },
      { rank1: "Halfway there. The \"Redeemable Hero\" posters are being printed. You just want a clean record.", rank3: "\"The public likes a struggle, Axel. But don't make it a habit. Secure the lead.\"", rankElse: "\"The propaganda department is having a hard time spinning this failure. Step it up.\"", img: "./images/axel-rush-intro.jpg" },
      { rank1: "The nebula gases part for you. Command notes your \"unwavering focus.\"", rank3: "\"The interference is affecting your performance. Calibrate your sensors and your mind.\"", rankElse: "\"Drifting into the clouds, Rush? We can send you back to the mines if you prefer the dust.\"", img: "./images/axel-rush-intro.jpg" },
      { rank1: "You untangle the track with ease. You're no longer just a soldier; you're a racer.", rank3: "\"Entangled in the pack? A leader doesn't follow. Cut through the noise.\"", rankElse: "\"You're getting lost in the colors. Focus on the finish line, or you'll never see home again.\"", img: "./images/axel-rush-intro.jpg" },
      { rank1: "The G-force is immense, but the gulag was heavier. You cross the line first.", rank3: "\"Struggling with the pull? The Hegemony demands strength. Don't let gravity win.\"", rankElse: "\"You're collapsing under the pressure. Maybe the Lunar surface is where you belong.\"", img: "./images/axel-rush-intro.jpg" },
      { rank1: "One race left. The pardon is within reach. Command sends: \"Secure the Source Code at all costs.\"", rank3: "\"The ridge is unforgiving. Just like your sentence. Win the final race, or the pardon is void.\"", rankElse: "\"Failure on the ridge? You're throwing away your life. Last chance, Pilot.\"", img: "./images/axel-rush-intro.jpg" },
      { rank1: "The Source Code is yours. You choose to delete all records, not just your own. Freedom for all.", rank3: "You win the pardon, but the Hegemony keeps the Code. You are free, but the system remains.", rankElse: "The pardon is denied. You are returned to the Lunar Gulags. The cycle continues without you.", img: "./images/axel-rush-intro.jpg" }
    ]
  },
  1: { // Lexi Nova (Underground) - Freedom Virus
    tracks: [
      { rank1: "Packet 1 sent. The Freedom Virus is a whisper in the Hegemony's ear.", rank3: "\"Signal is noisy, Lexi. Packet loss detected. We need a cleaner run for the uplink.\"", rankElse: "\"Encryption failed! They nearly traced the signal. Be more careful, Nova!\"", img: "./images/lexi-nova-intro.jpg" },
      { rank1: "You built this track. You leave a \"Glitch\" in an enforcer's wake that will take weeks to fix.", rank3: "\"The spiral is tricky for the antennas. We only got half the data. Step it up.\"", rankElse: "\"System breach! You're being hunted, Nova. Your slow pace is making you a target.\"", img: "./images/lexi-nova-intro.jpg" },
      { rank1: "The vacuum is perfect for transmission. 30% of the colony is now under your control.", rank3: "\"Static interference. We need you to hold the racing line better for the stable uplink.\"", rankElse: "\"Connection timed out. We lost the window, Lexi. The Underground is losing air.\"", img: "./images/lexi-nova-intro.jpg" },
      { rank1: "The citizens in the vents see the green trail and know you're winning for them.", rank3: "\"The signal is bouncing off the rusted walls. We got the data, but it's corrupted.\"", rankElse: "\"You're letting them crowd you. The resistance needs a champion, not a laggard.\"", img: "./images/lexi-nova-intro.jpg" },
      { rank1: "50% uploaded. The Hegemony's life-support monopoly is starting to crack.", rank3: "\"Overheating! The data-drive is melting. You need to win faster to cool down.\"", rankElse: "\"Critical failure. The virus was quarantined. We have to start the loop over.\"", img: "./images/lexi-nova-intro.jpg" },
      { rank1: "The nebula hides your signal. You download the colony's master blueprints.", rank3: "\"Too much interference. We missed the structural data. Try again next sector.\"", rankElse: "\"You're lost in the fog, Lexi. The Syndicate is losing faith in your navigation.\"", img: "./images/lexi-nova-intro.jpg" },
      { rank1: "You weave through the racers like a line of perfect code through a messy script.", rank3: "\"Logic error in your pathing. You're following when you should be bypassing.\"", rankElse: "\"The Hegemony is rewriting the track data. You're falling for their traps!\"", img: "./images/lexi-nova-intro.jpg" },
      { rank1: "You've rewritten the inertial dampeners. You feel weightless while the others struggle.", rank3: "\"The G-force is pulling the antenna out of alignment. Stabilize the craft!\"", rankElse: "\"Signal lost! The gravity well crushed our transmitter. We're blind, Nova!\"", img: "./images/lexi-nova-intro.jpg" },
      { rank1: "90% uploaded. The final gates are in sight. The Hegemony is panicking.", rank3: "\"The firewall is thickening. We need one more first-place finish to break through.\"", rankElse: "\"Encryption failed. They're tracing us! Speed up or the Syndicate is finished!\"", img: "./images/lexi-nova-intro.jpg" },
      { rank1: "Full deployment. Life-support is unlocked. No more \"pruning.\" You vanish into the vents.", rank3: "Partial success. Some sectors are free, but the war for the grid continues.", rankElse: "Virus deleted. The Hegemony tightens its grip. You are forced into exile.", img: "./images/lexi-nova-intro.jpg" }
    ]
  },
  2: { // Duke Vandal (Void) - Scrap King
    tracks: [
      { rank1: "High-grade scrap everywhere. You smashed through the grid for the metal.", rank3: "\"Not enough weight, Duke. They're pushing you around. Find more alloy.\"", rankElse: "\"You're racing like a paper plane. The Union is disappointed. Bring back the mass!\"", img: "./images/duke-vandal-intro.jpg" },
      { rank1: "The spiral groans as you bank. You're leaving dents in the colony's history.", rank3: "A few close shaves. The hull is holding, but your reputation is taking a hit.", rankElse: "Scratched the paint? The Union doesn't pay for aesthetic repairs. Win!", img: "./images/duke-vandal-profile.jpg" },
      { rank1: "Zero gravity, infinite mass. You're a wrecking ball in the dark.", rank3: "Floating too much? Anchor yourself to the lead, Duke.", rankElse: "Drifting into the void. The scrap value of your ship is dropping by the second.", img: "./images/duke-vandal-profile.jpg" },
      { rank1: "These pipes were made for your engines. You reclaim the steel as you pass.", rank3: "The canyon is narrow, but your lead is narrower. Bulk up.", rankElse: "Stuck in the debris. Use your mass to clear the path, you oaf!", img: "./images/duke-vandal-profile.jpg" },
      { rank1: "Heat means nothing to a slab of iron. You forge your victory in the loop.", rank3: "Melting under pressure? The Union expected a harder shell.", rankElse: "Core breach. Your ship is more valuable as scrap than as a racer right now.", img: "./images/duke-vandal-profile.jpg" },
      { rank1: "The nebula is thick, but your ship is thicker. You plow through the gas.", rank3: "Visibility is low, and so is your standing. Trust the radar, not the eyes.", rankElse: "Blindly wandering. You're missing the high-value targets, Duke.", img: "./images/duke-vandal-profile.jpg" },
      { rank1: "Tying the track in a knot. You're the heavy-weight champion of the Axis.", rank3: "Tangled with the light-weights? Crush them and move on.", rankElse: "You're being out-maneuvered. Size isn't everything if you can't hit them.", img: "./images/duke-vandal-profile.jpg" },
      { rank1: "Gravity is just a suggestion to a man with servos this strong.", rank3: "The well is deep. Don't let it swallow your ambition.", rankElse: "Crushed. The hull is buckling. Get out before you become a pancake.", img: "./images/duke-vandal-profile.jpg" },
      { rank1: "Scaling the ridge like a mountain of steel. The Source Code is in sight.", rank3: "The peak is slippery. Maintain your grip on the standings.", rankElse: "Tumbling down the slopes. The Union is already looking for a new heavy.", img: "./images/duke-vandal-profile.jpg" },
      { rank1: "The Source Code is claimed. The Scavenger Union rules the ruins. All hail the King of Scrap.", rank3: "You got the pay, but the Code slipped away. The Union survives, for now.", rankElse: "Ship destroyed. Legend forgotten. The Void reclaims its own.", img: "./images/duke-vandal-profile.jpg" }
    ]
  },
  3: { // Sira Flux (Underground) - Resistance Funding
    tracks: [
      { rank1: "Sira, the clinics are empty. The Resistance needs the League credits to buy medical supplies.", rank3: "The Resistance has found its champion, and the Hegemony has found a new nightmare.", rankElse: "The Resistance is fast. Get used to it.", img: "./images/sira-flux-intro.jpg" },
      { rank1: "The spiral echoes with the sound of hope. You're winning the hearts of the Outer Axis.", rank3: "The message is getting through, but the credits are coming in too slow.", rankElse: "The signal is fading. We need you to be more than a ghost—be a winner.", img: "./images/sira-flux-profile.jpg" },
      { rank1: "Vacuum silence. Just you and the mission. The clinics will have their medicine.", rank3: "A fragile victory. The Hegemony is starting to block our supply routes.", rankElse: "We lost a shipment today. Because you lost the lead. Don't let it happen again.", img: "./images/sira-flux-profile.jpg" },
      { rank1: "Navigating the canyon of despair. You're the light at the end of the tunnel.", rank3: "The walls are closing in. We need a more decisive run for the propaganda reels.", rankElse: "You're hitting the walls, Sira. The people need to see you fly, not crash.", img: "./images/sira-flux-profile.jpg" },
      { rank1: "The loop is a symbol of our struggle. And today, you're at the top.", rank3: "Hot on their heels, but not quite there. The Resistance needs a first-place finish.", rankElse: "Overwhelmed. The medical hubs are running on backup power. Focus!", img: "./images/sira-flux-profile.jpg" },
      { rank1: "Drifting through the nebula. You're the phantom they can't catch.", rank3: "They're tracking your energy signature. Be less predictable, Flux.", rankElse: "Lost in the clouds. The supplies are being intercepted. Secure the sector!", img: "./images/sira-flux-profile.jpg" },
      { rank1: "The knot is untied. The Resistance is growing. One more victory for the people.", rank3: "You're getting tangled in their politics. Focus on the race, save the clinics.", rankElse: "Defeat is a bitter pill. And we're out of actual pills. Win the next one!", img: "./images/sira-flux-profile.jpg" },
      { rank1: "Pulling through the gravity. You're lifting the spirits of every citizen in the vents.", rank3: "The weight of the world is on your shoulders. Don't let it crush the cause.", rankElse: "Grounding. The Hegemony has shut down three more clinics. We need those credits!", img: "./images/sira-flux-profile.jpg" },
      { rank1: "The ridge is the final barrier. The people are counting their blessings... and your wins.", rank3: "Almost at the peak. One final push for the medicine of the future.", rankElse: "Slipping away. The Resistance is losing ground. This is your final chance.", img: "./images/sira-flux-profile.jpg" },
      { rank1: "The Source Code is ours! Free medicine for all colonies. Sira Flux: The Angel of the Axis.", rank3: "The Resistance lives to fight another day, but the battle for the Code is lost.", rankElse: "Exiled. The Resistance is broken. The Hegemony wins the war for the air.", img: "./images/sira-flux-profile.jpg" }
    ]
  },
  4: { // Jaxon Volt (Hegemony) - Corporate Dominance
    tracks: [
      { rank1: "Share prices are up. The board is pleased with your initial performance metrics.", rank3: "A respectable ROI, Jaxon. But our investors expect a blue-chip performance.", rankElse: "A market correction is imminent. If you don't win, your sponsorship is voided.", img: "./images/jaxon-volt-intro.jpg" },
      { rank1: "The spiral is a perfect showcase for the new Volt-Dynamics hull. Stunning visuals.", rank3: "Acceptable exposure. But the lead pilot is getting all the prime-time airplay.", rankElse: "Bad for the brand, Volt. Very bad. The marketing department is furious.", img: "./images/jaxon-volt-profile.jpg" },
      { rank1: "Vacuum dominance. You're the majority shareholder of the racing line now.", rank3: "Steady growth, but we need an aggressive expansion into first place.", rankElse: "You're bleeding market share. The board is discussing your replacement.", img: "./images/jaxon-volt-profile.jpg" },
      { rank1: "Navigating the canyon like a hostile takeover. Cold, calculated, and successful.", rank3: "You're playing it safe. Risk-taking is high, but the rewards are higher. Win!", rankElse: "Stagnant. You're a depreciating asset right now, Jaxon. Turn it around.", img: "./images/jaxon-volt-profile.jpg" },
      { rank1: "The loop is our new logo. And you're at the center of it. Perfect branding.", rank3: "A minor dip in the ratings. You need more 'style and efficiency' to satisfy the board.", rankElse: "PR disaster. The 'Volt' name is being dragged through the scrap. Win or else!", img: "./images/jaxon-volt-profile.jpg" },
      { rank1: "Nebula drift is the future of luxury travel. And you're leading the way.", rank3: "The fog is affecting the ad-revenue. We need a clearer victory in the next sector.", rankElse: "You're invisible. And in marketing, invisible is dead. Get to the front!", img: "./images/jaxon-volt-profile.jpg" },
      { rank1: "Untying the knot with corporate precision. You're the CEO of the track today.", rank3: "A merger of second and third place? Not good enough. We want a monopoly.", rankElse: "Hostile competitors are pushing you out. Reclaim your position or face liquidation.", img: "./images/jaxon-volt-profile.jpg" },
      { rank1: "Gravity well conquered. Your stock is at an all-time high. The board is ecstatic.", rank3: "Pulling through the Gs, but you're slowing down. Maintain the momentum!", rankElse: "Market crash. Your performance is a total loss. This is your final quarter.", img: "./images/jaxon-volt-profile.jpg" },
      { rank1: "The final ridge. The Source Code is a line-item on your victory report.", rank3: "One race to go. The shareholders are nervous. Give them a reason to believe.", rankElse: "Liquidation is looming. If you don't win the final race, you're out of the system.", img: "./images/jaxon-volt-profile.jpg" },
      { rank1: "Source Code acquired. Volt-Dynamics owns the future. You're the new Vice President.", rank3: "Profit targets met, but the Code is gone. A successful but incomplete fiscal year.", rankElse: "Contract terminated. Career deleted. The market has spoken.", img: "./images/jaxon-volt-profile.jpg" }
    ]
  },
  5: { // Zara Quinn (Underground) - Reclaiming Home
    tracks: [
      { rank1: "The credits are piling up. Your home world is one step closer to being ours again.", rank3: "Not enough for the down-payment, Zara. We need those first-place purses.", rankElse: "Scavenging for scraps again? The world-fund is empty. We need wins!", img: "./images/zara-quinn-intro.jpg" },
      { rank1: "Banking through the spiral like you're weaving through your old home's debris.", rank3: "Steady progress, but the developers are raising the price of the sector.", rankElse: "You're falling behind. At this rate, they'll turn your home into a mall.", img: "./images/zara-quinn-profile.jpg" },
      { rank1: "The vacuum is where we learned to fly. And today, you're the master of it.", rank3: "A close race in the dark. Don't let the big corporations crowd you out.", rankElse: "Lost in the void. Just like our future if you don't start winning.", img: "./images/zara-quinn-profile.jpg" },
      { rank1: "This canyon is just a bigger version of the mining pods. You've got this.", rank3: "Scraping the walls. Be careful with the ship—it's the only one we have.", rankElse: "Stuck in the mud. The scavengers are losing faith in your flying, Zara.", img: "./images/zara-quinn-profile.jpg" },
      { rank1: "The loop is the path to freedom. And you're flying it perfectly.", rank3: "Halfway to the goal, but the bank is calling in the loans. Win faster!", rankElse: "Critical error. We can't afford these repairs, Zara. You have to win.", img: "./images/zara-quinn-profile.jpg" },
      { rank1: "Drifting through the nebula. The credits are flowing in like the gas.", rank3: "The nebula is thick, and our hopes are thinning. Reclaim the lead!", rankElse: "You're losing the trail. The world-fund is stagnant. Do something!", img: "./images/zara-quinn-profile.jpg" },
      { rank1: "Untangling the knot of your past. Each win is a brick in your new home.", rank3: "Getting tangled with the Hegemony enforcers. Stay clear and stay fast.", rankElse: "Defeat is a luxury we can't afford. The developers are moving in.", img: "./images/zara-quinn-profile.jpg" },
      { rank1: "Defying gravity for your family. You're the hero of the Dust-Rim today.", rank3: "The pull is strong, but your will is stronger. Hold on to that third place.", rankElse: "Crushed by the weight of expectations. We're losing the contract, Zara!", img: "./images/zara-quinn-profile.jpg" },
      { rank1: "The final ridge. The Source Code is the key to the whole sector. Win it!", rank3: "Almost there. The escrow is full, but the Code would secure it forever.", rankElse: "One race left, and you're in the back. Do you want to be a refugee forever?", img: "./images/zara-quinn-profile.jpg" },
      { rank1: "HOME ACQUIRED. The Source Code is yours. The Dust-Rim is free! All hail Zara Quinn.", rank3: "You bought the world, but the Code is gone. A home with no future.", rankElse: "Evicted. The world is sold. You're just another ghost in the machine.", img: "./images/zara-quinn-profile.jpg" }
    ]
  },
  6: { // Korvath (Void) - Digital Ascension
    tracks: [
      { rank1: "Data-sync optimal. Your consciousness is expanding with every win.", rank3: "Latency detected. Your neural-link is struggling with the speed.", rankElse: "Packet loss. Your physical form is a bottleneck. We need more data!", img: "./images/korvath-intro.jpg" },
      { rank1: "The spiral is a logical progression. You see the code behind the track.", rank3: "A few glitches in your pathing. Re-calibrate your sensory input.", rankElse: "System crash. Your human heritage is failing you. Purge the weakness!", img: "./images/korvath-profile.jpg" },
      { rank1: "Vacuum silence is the perfect environment for digital thought. Pure focus.", rank3: "The void is cold, but your logic should be colder. Reclaim the lead.", rankElse: "Drifting into analog thoughts. Focus on the stream, not the ship.", img: "./images/korvath-profile.jpg" },
      { rank1: "Navigating the canyon of data. You're a virus in their hardware.", rank3: "Structural integrity at 70%. Your ship is a shell. Protect the core.", rankElse: "Hardware failure. You're being overwritten by the competition.", img: "./images/korvath-profile.jpg" },
      { rank1: "The loop is an infinite recursion of your victory. Beautiful code.", rank3: "Stuck in a sub-routine of second place. Break the loop and win.", rankElse: "Infinite loop of failure. Reset your ambition and try again.", img: "./images/korvath-profile.jpg" },
      { rank1: "The nebula is a sea of raw information. You're absorbing it all.", rank3: "Signal interference from the nebula. Trust your internal algorithms.", rankElse: "Lost in the noise. You're failing to differentiate the signal. Win!", img: "./images/korvath-profile.jpg" },
      { rank1: "Untying the knot of reality. You're transcending the physical plane.", rank3: "Tangled in the simulation. Remember: the track is just data.", rankElse: "You're being deleted from the rankings. Re-upload your dominance!", img: "./images/korvath-profile.jpg" },
      { rank1: "Gravity is a physical constraint. And you're becoming more than physical.", rank3: "The well is pulling at your hull. Strengthen the energy fields.", rankElse: "Crushed. Your physical shell is a liability. Focus on the upload!", img: "./images/korvath-profile.jpg" },
      { rank1: "The final ridge. The Source Code is the final algorithm for Ascension.", rank3: "Almost synchronized. One final race to achieve the ultimate state.", rankElse: "Upload failed. Your consciousness is trapped in a dying shell. Win!", img: "./images/korvath-profile.jpg" },
      { rank1: "ASCENSION COMPLETE. You are the Source Code. The Axis is your simulation now.", rank3: "Upload successful, but the Code is missing. A digital existence in a physical cage.", rankElse: "System deleted. Consciousness erased. The void is final.", img: "./images/korvath-profile.jpg" }
    ]
  },
  7: { // Nyx Shadow (Void) - The Eraser
    tracks: [
      { rank1: "Mission successful. Your identity is a little more blurred today.", rank3: "Too visible, Shadow. They're starting to track your movements.", rankElse: "Exposed! The Hegemony has a lock on your signature. Fade away!", img: "./images/nyx-shadow-intro.jpg" },
      { rank1: "The spiral is a blur in your wake. You're a ghost in their radar.", rank3: "Slipping, but not invisible. We need a cleaner run for the deletion.", rankElse: "You're a beacon in the night. Win or be captured and archived.", img: "./images/nyx-shadow-profile.jpg" },
      { rank1: "Vacuum silence. Your past is being erased with every kilometer.", rank3: "A close race. The dark doesn't hide you if you're not in the lead.", rankElse: "They're rewriting your history while you're in the back. Win!", img: "./images/nyx-shadow-profile.jpg" },
      { rank1: "Navigating the canyon like a shadow in a cave. Perfectly stealthy.", rank3: "Scraping the walls? A phantom doesn't leave physical evidence. Focus.", rankElse: "Bumping and grinding. You're making too much noise. Win or die.", img: "./images/nyx-shadow-profile.jpg" },
      { rank1: "The loop is a zero. Just like your identity will soon be. Perfect.", rank3: "They're closing the gap. Fade back into the lead, Shadow.", rankElse: "You're a headline, not a ghost. This is unacceptable. Reclaim the lead!", img: "./images/nyx-shadow-profile.jpg" },
      { rank1: "Drifting through the nebula. You're a smudge on the universe's lens.", rank3: "The fog is your friend, but the rankings are not. Move up.", rankElse: "Lost in the light. You're being documented. Stop the race and win!", img: "./images/nyx-shadow-profile.jpg" },
      { rank1: "Untying the knot of your existence. Each win is a deleted file.", rank3: "Tangled in the web of reality. Cut yourself free and win.", rankElse: "You're becoming a legend. And legends are easy to track. Fade!", img: "./images/nyx-shadow-profile.jpg" },
      { rank1: "Gravity well conquered. You're the heaviest shadow in the system.", rank3: "The pull is dragging your secrets into the light. Win faster!", rankElse: "Crushed by the weight of your own history. Delete it and win!", img: "./images/nyx-shadow-profile.jpg" },
      { rank1: "The final ridge. The Source Code will erase everything. Win it!", rank3: "Almost anonymous. One more race to be forgotten forever.", rankElse: "One race left, and you're a celebrity. This is a disaster. Win!", img: "./images/nyx-shadow-profile.jpg" },
      { rank1: "TOTAL ERASURE. The Source Code has deleted you from time. Freedom at last.", rank3: "You're a ghost, but the records remain. A half-life in the dark.", rankElse: "Archived. Imprisoned. Your history is now public property.", img: "./images/nyx-shadow-profile.jpg" }
    ]
  },
  8: { // Ghost (Void) - The Glitch
    tracks: [
      { rank1: "The loop is broken. You are the glitch that shouldn't exist.", rank3: "Static in the air. The simulation is fighting your presence.", rankElse: "Reality is stabilizing. You're losing your grip on the track. Win!", img: "./images/ghost-intro.jpg" },
      { rank1: "Banking through the spiral like a temporal anomaly. Beautifully broken.", rank3: "A few frames dropped in your pathing. Re-sync with the nightmare.", rankElse: "System error. You're being quarantined by the competition. Win!", img: "./images/ghost-profile.jpg" },
      { rank1: "Vacuum silence. You are the nightmare that haunts the colony's sleep.", rank3: "The dark is empty, and so is your lead. Fill it with static.", rankElse: "Fading into reality. You're becoming too solid. Reclaim the glitch!", img: "./images/ghost-profile.jpg" },
      { rank1: "Navigating the canyon of shadows. You're the monster under the bed.", rank3: "The walls are real, Ghost. Don't let them ground your spirit.", rankElse: "Trapped in the physical plane. Win or be erased by the system.", img: "./images/ghost-profile.jpg" },
      { rank1: "The loop is a fracture in time. And you're the one who broke it.", rank3: "Slowing down? The simulation is catching up. Speed up the glitch!", rankElse: "Re-booting. You're losing the race and your existence. Win!", img: "./images/ghost-profile.jpg" },
      { rank1: "Drifting through the nebula gas like a bad memory. Haunting.", rank3: "The fog is thin. You're too visible. Return to the static.", rankElse: "Lost in the light of truth. You're being deleted. Win the race!", img: "./images/ghost-profile.jpg" },
      { rank1: "Untying the knot of fate. You're the variable they didn't expect.", rank3: "Tangled in the code of the universe. Cut yourself free and win.", rankElse: "You're being written out of the script. Re-assert the nightmare!", img: "./images/ghost-profile.jpg" },
      { rank1: "Gravity well conquered. You're the heaviest glitch in the machine.", rank3: "The pull is strong, but the static is stronger. Hold on.", rankElse: "Crushed by the weight of reality. The simulation is winning. Win!", img: "./images/ghost-profile.jpg" },
      { rank1: "The final ridge. The Source Code will break the world. Win it!", rank3: "Almost at the end of the line. One final push to end it all.", rankElse: "The loop is closing. If you don't win, you're deleted forever.", img: "./images/ghost-profile.jpg" },
      { rank1: "REALITY BROKEN. The Source Code is yours. The Axis is a glitch. All is static.", rank3: "The simulation continues, but you are a part of it. A haunting presence.", rankElse: "Deleted. Reset. The loop begins again without the glitch.", img: "./images/ghost-profile.jpg" }
    ]
  }
};
