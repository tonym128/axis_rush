// Note: Peer and mqtt are loaded via CDN in index.html to avoid bundling issues with WebRTC/MQTT in Vite.

export class NetworkManager {
  constructor(game) {
    this.game = game;
    this.peer = null;
    this.mqttClient = null;
    this.isHost = false;
    this.connections = {}; // peerId -> DataConnection
    this.hostConnection = null; // DataConnection to host
    this.players = {}; // peerId -> { pilotId, vehicleId, name, isHost, ready }
    this.activeHosts = {}; // id -> { name, mode, players, maxPlayers, lastSeen }
    this.lobbyTopic = 'axis-rush-2026/lobby/announcements';
    this.myId = null;
    this.hostConfig = {
      mode: 'SINGLE',
      mapIndex: 0,
      difficulty: 1,
      useAI: true
    };
  }

  initPeer(onReady) {
    if (this.peer) return onReady();
    // Using global Peer from CDN
    this.peer = new window.Peer(null, {
      debug: 2
    });
    this.peer.on('open', (id) => {
      this.myId = id;
      onReady();
    });
    this.peer.on('connection', (conn) => {
      if (!this.isHost) return;
      conn.on('open', () => {
        this.connections[conn.peer] = conn;
      });
      conn.on('data', (data) => this.handleHostData(conn.peer, data));
      conn.on('close', () => {
        delete this.connections[conn.peer];
        delete this.players[conn.peer];
        this.broadcastLobbyState();
      });
    });
    this.peer.on('error', (err) => {
      console.error('Peer error:', err);
      alert('Network Error: ' + err.type);
    });
  }

  // --- LOBBY BROWSER ---
  initLobbyBrowser(onUpdate) {
    if (!this.mqttClient) {
      // Using global mqtt from CDN
      this.mqttClient = window.mqtt.connect('wss://test.mosquitto.org:8081');
      this.mqttClient.on('connect', () => {
        this.mqttClient.subscribe(this.lobbyTopic);
      });
      this.mqttClient.on('message', (topic, message) => {
        try {
          const host = JSON.parse(message.toString());
          if (host.id !== this.myId) {
            this.activeHosts[host.id] = { ...host, lastSeen: Date.now() };
            onUpdate(this.activeHosts);
          }
        } catch (e) {}
      });
      // Cleanup stale hosts
      setInterval(() => {
        let changed = false;
        const now = Date.now();
        for (const id in this.activeHosts) {
          if (now - this.activeHosts[id].lastSeen > 6000) {
            delete this.activeHosts[id];
            changed = true;
          }
        }
        if (changed) onUpdate(this.activeHosts);
      }, 3000);
    }
  }

  closeLobbyBrowser() {
    if (this.mqttClient) {
      this.mqttClient.end();
      this.mqttClient = null;
    }
    this.activeHosts = {};
  }

  // --- HOSTING ---
  startHost(playerName, pilotId, vehicleId, config) {
    this.isHost = true;
    this.hostConfig = config;
    this.initPeer(() => {
      this.players[this.myId] = {
        id: this.myId,
        name: playerName,
        pilotId: pilotId,
        vehicleId: vehicleId,
        isHost: true,
        ready: true
      };
      
      // Announce host to MQTT
      if (!this.mqttClient) {
        this.mqttClient = window.mqtt.connect('wss://test.mosquitto.org:8081');
      }
      this.announceInterval = setInterval(() => {
        if (this.mqttClient && this.mqttClient.connected) {
          const numPlayers = Object.keys(this.players).length;
          this.mqttClient.publish(this.lobbyTopic, JSON.stringify({
            id: this.myId,
            name: `${playerName}'s Game`,
            mode: config.mode,
            players: numPlayers,
            maxPlayers: 8
          }));
        }
      }, 3000);
      
      this.game.updateLobbyUI();
    });
  }

  stopHost() {
    this.isHost = false;
    clearInterval(this.announceInterval);
    for (let id in this.connections) {
      this.connections[id].close();
    }
    this.connections = {};
    this.players = {};
  }

  // --- JOINING ---
  joinHost(hostId, playerName, pilotId, vehicleId) {
    this.isHost = false;
    this.initPeer(() => {
      this.hostConnection = this.peer.connect(hostId, { reliable: true });
      this.hostConnection.on('open', () => {
        this.hostConnection.send({
          type: 'JOIN_LOBBY',
          player: { name: playerName, pilotId, vehicleId, ready: true }
        });
      });
      this.hostConnection.on('data', (data) => this.handleClientData(data));
      this.hostConnection.on('close', () => {
        alert('Host disconnected');
        this.game.showMenu();
        this.hostConnection = null;
      });
      this.hostConnection.on('error', (err) => {
        alert('Connection error');
      });
    });
  }

  // --- MESSAGING ---
  broadcastLobbyState() {
    if (!this.isHost) return;
    const msg = {
      type: 'LOBBY_STATE',
      players: this.players,
      config: this.hostConfig
    };
    for (let id in this.connections) {
      this.connections[id].send(msg);
    }
    this.game.updateLobbyUI();
  }

  broadcastGameState(state) {
    if (!this.isHost) return;
    const msg = { type: 'GAME_STATE', state };
    for (let id in this.connections) {
      this.connections[id].send(msg);
    }
  }

  startGameHost() {
    if (!this.isHost) return;
    clearInterval(this.announceInterval);
    const msg = {
      type: 'START_GAME',
      players: this.players,
      config: this.hostConfig
    };
    for (let id in this.connections) {
      this.connections[id].send(msg);
    }
    this.game.startMultiplayerRace(this.players, this.hostConfig);
  }

  sendInput(inputs) {
    if (this.isHost) return;
    if (this.hostConnection && this.hostConnection.open) {
      this.hostConnection.send({ type: 'INPUT', inputs });
    }
  }

  // --- HANDLERS ---
  handleHostData(peerId, data) {
    if (data.type === 'JOIN_LOBBY') {
      this.players[peerId] = { ...data.player, id: peerId, isHost: false };
      this.broadcastLobbyState();
    } else if (data.type === 'INPUT') {
      if (this.game.remoteInputs) {
        this.game.remoteInputs[peerId] = data.inputs;
      }
    }
  }

  handleClientData(data) {
    if (data.type === 'LOBBY_STATE') {
      this.players = data.players;
      this.hostConfig = data.config;
      this.game.updateLobbyUI();
    } else if (data.type === 'START_GAME') {
      this.players = data.players;
      this.hostConfig = data.config;
      this.game.startMultiplayerRace(this.players, this.hostConfig);
    } else if (data.type === 'GAME_STATE') {
      this.game.applyNetworkState(data.state);
    }
  }
}
