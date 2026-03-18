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
    
    // Performance Metrics
    this.metrics = {
      delay: 0,
      throughputIn: 0, // bytes/sec
      throughputOut: 0, // bytes/sec
      bytesIn: 0,
      bytesOut: 0,
      lastMeasureTime: Date.now()
    };
    this.pingInterval = null;
  }

  initPeer(onReady) {
    if (this.peer) return onReady();
    // Using global Peer from CDN
    this.peer = new window.Peer(null, {
      debug: 1
    });
    this.peer.on('open', (id) => {
      this.myId = id;
      this.startMetricsLoop();
      onReady();
    });
    this.peer.on('connection', (conn) => {
      if (!this.isHost) return;
      conn.on('open', () => {
        this.connections[conn.peer] = conn;
      });
      conn.on('data', (data) => {
        this.trackInbound(data);
        this.handleHostData(conn.peer, data);
      });
      conn.on('close', () => {
        delete this.connections[conn.peer];
        delete this.players[conn.peer];
        this.broadcastLobbyState();
      });
    });
    this.peer.on('error', (err) => {
      console.error('Peer error:', err);
      if (err.type !== 'peer-unavailable') {
        this.game.showMessage('NETWORK ERROR', 'Peer error: ' + err.type);
      }
    });
  }

  startMetricsLoop() {
    setInterval(() => {
      const now = Date.now();
      const dt = (now - this.metrics.lastMeasureTime) / 1000;
      if (dt >= 1.0) {
        this.metrics.throughputIn = Math.round(this.metrics.bytesIn / dt);
        this.metrics.throughputOut = Math.round(this.metrics.bytesOut / dt);
        this.metrics.bytesIn = 0;
        this.metrics.bytesOut = 0;
        this.metrics.lastMeasureTime = now;
      }
    }, 1000);

    // Ping loop for delay
    setInterval(() => {
      if (this.isHost) {
        // Host doesn't ping themselves, but could ping all clients? 
        // Usually clients ping host to see their delay.
      } else if (this.hostConnection && this.hostConnection.open) {
        this.sendData({ type: 'PING', t: Date.now() }, this.hostConnection);
      }
    }, 2000);
  }

  trackInbound(data) {
    try {
      this.metrics.bytesIn += JSON.stringify(data).length;
    } catch(e) {}
  }

  sendData(data, conn) {
    if (conn && conn.open) {
      conn.send(data);
      try {
        this.metrics.bytesOut += JSON.stringify(data).length;
      } catch(e) {}
    }
  }

  // --- LOBBY BROWSER ---
  initLobbyBrowser(onUpdate) {
    if (!this.mqttClient) {
      // Using global mqtt from CDN
      const client = window.mqtt.connect('wss://test.mosquitto.org:8081');
      this.mqttClient = client;
      
      client.on('connect', () => {
        client.subscribe(this.lobbyTopic);
      });
      client.on('message', (topic, message) => {
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
        ready: false
      };
      
      // Announce host to MQTT
      if (!this.mqttClient) {
        const client = window.mqtt.connect('wss://test.mosquitto.org:8081');
        this.mqttClient = client;
      }
      this.announceInterval = setInterval(() => {
        const client = this.mqttClient;
        if (client && client.connected) {
          const numPlayers = Object.keys(this.players).length;
          client.publish(this.lobbyTopic, JSON.stringify({
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
        this.sendData({
          type: 'JOIN_LOBBY',
          player: { name: playerName, pilotId, vehicleId, ready: false }
        }, this.hostConnection);
      });
      this.hostConnection.on('data', (data) => {
        this.trackInbound(data);
        this.handleClientData(data);
      });
      this.hostConnection.on('close', () => {
        this.game.showMessage('DISCONNECTED', 'Host disconnected', () => {
          this.game.showMenu();
        });
        this.hostConnection = null;
      });
      this.hostConnection.on('error', (err) => {
        this.game.showMessage('CONNECTION ERROR', 'A network error occurred.');
      });
    });
  }

  toggleReady() {
    if (this.isHost) {
      this.players[this.myId].ready = !this.players[this.myId].ready;
      this.broadcastLobbyState();
    } else if (this.hostConnection && this.hostConnection.open) {
      const myPlayer = this.players[this.myId];
      if (myPlayer) {
        this.sendData({ type: 'TOGGLE_READY' }, this.hostConnection);
      }
    }
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
      this.sendData(msg, this.connections[id]);
    }
    this.game.updateLobbyUI();
  }

  broadcastGameState(state) {
    if (!this.isHost) return;
    const msg = { type: 'GAME_STATE', state };
    for (let id in this.connections) {
      this.sendData(msg, this.connections[id]);
    }
  }

  startGameHost() {
    if (!this.isHost) return;
    
    // Check if everyone is ready
    const allReady = Object.values(this.players).every(p => p.ready);
    if (!allReady) {
      this.game.showMessage('LOBBY NOT READY', 'Not all players are ready!');
      return;
    }

    clearInterval(this.announceInterval);
    const msg = {
      type: 'START_GAME',
      players: this.players,
      config: this.hostConfig
    };
    for (let id in this.connections) {
      this.sendData(msg, this.connections[id]);
    }
    this.game.startMultiplayerRace(this.players, this.hostConfig);
  }

  sendInput(inputs) {
    if (this.isHost) return;
    if (this.hostConnection && this.hostConnection.open) {
      this.sendData({ type: 'INPUT', inputs }, this.hostConnection);
    }
  }

  // --- HANDLERS ---
  handleHostData(peerId, data) {
    if (data.type === 'PING') {
      this.sendData({ type: 'PONG', t: data.t }, this.connections[peerId]);
    } else if (data.type === 'JOIN_LOBBY') {
      this.players[peerId] = { ...data.player, id: peerId, isHost: false };
      this.broadcastLobbyState();
    } else if (data.type === 'TOGGLE_READY') {
      if (this.players[peerId]) {
        this.players[peerId].ready = !this.players[peerId].ready;
        this.broadcastLobbyState();
      }
    } else if (data.type === 'INPUT') {
      if (this.game.remoteInputs) {
        this.game.remoteInputs[peerId] = data.inputs;
      }
    }
  }

  handleClientData(data) {
    if (data.type === 'PONG') {
      this.metrics.delay = Date.now() - data.t;
    } else if (data.type === 'LOBBY_STATE') {
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
