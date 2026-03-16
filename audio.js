export class AudioEngine {
  constructor() {
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.isPlaying = false;
    this.tempo = 140; // BPM
    this.lookahead = 25.0; // ms
    this.scheduleAheadTime = 0.1; // s
    this.nextNoteTime = 0.0;
    this.current16thNote = 0;
    this.timerID = null;
    
    this.mode = 'menu'; // 'menu' or 'race'
    this.trackIndex = 0;
    this.measureCount = 0; // To track dynamic changes over time
    
    // Default patterns
    this.kickPattern =   [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0];
    this.hatPattern =    [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 1];
    this.snarePattern =  [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0];
    this.bassPattern =   [1, 1, 0, 1, 0, 1, 1, 0, 1, 0, 0, 1, 0, 1, 0, 1];
    this.bassNotes =     [36, 36, 0, 39, 0, 36, 41, 0, 43, 0, 0, 36, 0, 46, 0, 43];
    
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.5;
    this.masterGain.connect(this.ctx.destination);
    
    this.musicGain = this.ctx.createGain();
    this.musicGain.gain.value = 0.1;
    this.musicGain.connect(this.masterGain);

    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.value = 0.8;
    this.sfxGain.connect(this.masterGain);

    this.bassFilter = this.ctx.createBiquadFilter();
    this.bassFilter.type = 'lowpass';
    this.bassFilter.frequency.value = 1000;
    this.bassFilter.Q.value = 5;
    this.bassFilter.connect(this.musicGain);
    
    this.scheduler = this.scheduler.bind(this);
  }
  
  start() {
    if (this.isPlaying) return;
    this.ctx.resume();
    this.isPlaying = true;
    this.nextNoteTime = this.ctx.currentTime + 0.05;
    this.scheduler();
  }
  
  stop() {
    this.isPlaying = false;
    clearTimeout(this.timerID);
  }
  
  setMode(mode, trackIndex = 0, difficulty = 1) {
    this.mode = mode;
    this.trackIndex = trackIndex;
    this.measureCount = 0;
    
    if (mode === 'menu') {
      this.tempo = 90; // Soft and slow
    } else {
      // Race mode: vary tempo slightly by track and difficulty
      this.tempo = 140 + (difficulty * 15) + (trackIndex % 3) * 5;
    }
    
    // Only update context parameters if it's already running to avoid warnings
    if (this.ctx.state === 'running') {
      if (mode === 'menu') {
        this.bassFilter.frequency.setTargetAtTime(400, this.ctx.currentTime, 0.1);
      } else {
        this.bassFilter.frequency.setTargetAtTime(1000 + difficulty * 500, this.ctx.currentTime, 0.1);
      }
    }
    
    this.updatePatterns();
  }

  updatePatterns() {
    if (this.mode === 'menu') {
      // Ambient, slow, sparse beat
      this.kickPattern =   [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
      this.hatPattern =    [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0]; // Steady slow pulse
      this.snarePattern =  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]; // No snare
      this.bassPattern =   [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0]; // Long droning notes
      // Minor 9th arpeggio feel
      this.bassNotes =     [48, 0, 0, 0, 51, 0, 0, 0, 55, 0, 0, 0, 58, 0, 0, 0];
      return;
    }

    // Race mode: Unique patterns based on track index + measure count
    const t = this.trackIndex;
    const m = this.measureCount % 4; // 4 measure loop cycle

    // Kick: gets more intense on the 4th measure (fills)
    if (m === 3) {
      this.kickPattern = [1, 0, 0, 0, 1, 1, 0, 0, 1, 0, 1, 0, 1, 1, 1, 1];
    } else {
      // Base kick varies by track
      if (t % 2 === 0) this.kickPattern = [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0]; // 4 on floor
      else this.kickPattern =             [1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0]; // Breakbeat
    }

    // Snare
    if (t % 3 === 0) this.snarePattern =  [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0]; // Standard
    else if (t % 3 === 1) this.snarePattern=[0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 1]; // Syncopated
    else this.snarePattern =              [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0]; // Fast offbeat

    // Hats: get faster on measure 2 and 3
    if (m === 0) this.hatPattern =        [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0];
    else if (m === 1) this.hatPattern =   [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
    else this.hatPattern =                [0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0];

    // Bassline evolution based on track
    const roots = [36, 38, 40, 41, 43, 45, 47, 48, 50, 52]; // Root note per track
    const r = roots[t % roots.length];

    if (t % 2 === 0) {
      // Driving 16th note bass
      this.bassPattern = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
      this.bassNotes = [r, r, r+12, r, r, r, r+12, r, r, r, r+7, r, r, r, r+10, r];
    } else {
      // Funky syncopated bass
      this.bassPattern = [1, 0, 1, 0, 0, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1, 0];
      this.bassNotes = [r, 0, r+7, 0, 0, r+10, r+12, 0, r, 0, 0, r+7, 0, r+3, r+5, 0];
    }
    
    // Shift up an octave on measure 3 for tension
    if (m === 2) {
      this.bassNotes = this.bassNotes.map(n => n === 0 ? 0 : n + 12);
    }
  }
  
  playKick(time) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.sfxGain);
    
    osc.frequency.setValueAtTime(150, time);
    osc.frequency.exponentialRampToValueAtTime(0.001, time + 0.5);
    
    gain.gain.setValueAtTime(1, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.5);
    
    osc.start(time);
    osc.stop(time + 0.5);
  }
  
  playHat(time) {
    const bufferSize = this.ctx.sampleRate * 0.1; // 100ms buffer
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 7000;
    
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.5, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.1);
    
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);
    
    noise.start(time);
  }
  
  playSnare(time) {
    const osc = this.ctx.createOscillator();
    osc.type = 'triangle';
    const oscGain = this.ctx.createGain();
    
    osc.connect(oscGain);
    oscGain.connect(this.sfxGain);
    
    osc.frequency.setValueAtTime(250, time);
    oscGain.gain.setValueAtTime(0.5, time);
    oscGain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);
    osc.start(time);
    osc.stop(time + 0.2);
    
    // Noise part
    const bufferSize = this.ctx.sampleRate * 0.2; 
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 2000;
    
    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.5, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);
    
    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.sfxGain);
    noise.start(time);
  }
  
  midiToFreq(midi) {
    return 440 * Math.pow(2, (midi - 69) / 12);
  }
  
  playBass(time, note) {
    const osc = this.ctx.createOscillator();
    osc.type = 'sawtooth';
    const gain = this.ctx.createGain();
    
    osc.connect(gain);
    gain.connect(this.bassFilter);
    
    osc.frequency.value = this.midiToFreq(note);
    
    gain.gain.setValueAtTime(0.8, time);
    gain.gain.setTargetAtTime(0.0, time + 0.05, 0.1);
    
    // Filter envelope
    this.bassFilter.frequency.setValueAtTime(400, time);
    this.bassFilter.frequency.exponentialRampToValueAtTime(2000, time + 0.1);
    this.bassFilter.frequency.exponentialRampToValueAtTime(400, time + 0.2);
    
    osc.start(time);
    osc.stop(time + 0.3);
  }

  playLapComplete() {
    const time = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc1.type = 'square';
    osc2.type = 'sawtooth';
    
    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.sfxGain);
    
    osc1.frequency.setValueAtTime(220, time);
    osc1.frequency.exponentialRampToValueAtTime(880, time + 0.5);
    osc2.frequency.setValueAtTime(220 * 1.01, time);
    osc2.frequency.exponentialRampToValueAtTime(880 * 1.01, time + 0.5);
    
    gain.gain.setValueAtTime(0.3, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.6);
    
    osc1.start(time);
    osc2.start(time);
    osc1.stop(time + 0.6);
    osc2.stop(time + 0.6);
  }
  
  scheduleNote(beatNumber, time) {
    if (this.kickPattern[beatNumber]) {
      this.playKick(time);
    }
    if (this.hatPattern[beatNumber]) {
      this.playHat(time);
    }
    if (this.snarePattern[beatNumber]) {
      this.playSnare(time);
    }
    if (this.bassPattern[beatNumber] && this.bassNotes[beatNumber] !== 0) {
      this.playBass(time, this.bassNotes[beatNumber]);
    }
  }
  
  scheduler() {
    while (this.nextNoteTime < this.ctx.currentTime + this.scheduleAheadTime) {
      this.scheduleNote(this.current16thNote, this.nextNoteTime);
      this.nextNote();
    }
    this.timerID = setTimeout(this.scheduler, this.lookahead);
  }

  nextNote() {
    const secondsPerBeat = 60.0 / this.tempo;
    this.nextNoteTime += 0.25 * secondsPerBeat;
    this.current16thNote++;
    if (this.current16thNote === 16) {
      this.current16thNote = 0;
      this.measureCount++;
      this.updatePatterns(); // Refresh patterns at start of measure
    }
  }
}

export const audioEngine = new AudioEngine();
