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
    
    // Pattern lengths
    this.kickPattern =   [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0];
    this.hatPattern =    [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 1];
    this.snarePattern =  [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0];
    this.bassPattern =   [1, 1, 0, 1, 0, 1, 1, 0, 1, 0, 0, 1, 0, 1, 0, 1];
    
    // Bass line notes (minor pentatonic)
    this.bassNotes = [36, 36, 0, 39, 0, 36, 41, 0, 43, 0, 0, 36, 0, 46, 0, 43];
    
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.5;
    this.masterGain.connect(this.ctx.destination);
    
    // Filter for the bassline
    this.bassFilter = this.ctx.createBiquadFilter();
    this.bassFilter.type = 'lowpass';
    this.bassFilter.frequency.value = 1000;
    this.bassFilter.Q.value = 5;
    this.bassFilter.connect(this.masterGain);
    
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
  
  setIntensity(level) {
    // 0 = novice, 1 = pro, 2 = elite
    this.tempo = 140 + level * 20;
    this.bassFilter.frequency.value = 800 + level * 1000;
  }
  
  nextNote() {
    const secondsPerBeat = 60.0 / this.tempo;
    this.nextNoteTime += 0.25 * secondsPerBeat;
    this.current16thNote++;
    if (this.current16thNote === 16) {
      this.current16thNote = 0;
    }
  }
  
  playKick(time) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.masterGain);
    
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
    gain.connect(this.masterGain);
    
    noise.start(time);
  }
  
  playSnare(time) {
    const osc = this.ctx.createOscillator();
    osc.type = 'triangle';
    const oscGain = this.ctx.createGain();
    
    osc.connect(oscGain);
    oscGain.connect(this.masterGain);
    
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
    noiseGain.connect(this.masterGain);
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
}

export const audioEngine = new AudioEngine();
