// Gerenciador de comunicação com o servidor via Socket.IO
export class SocketManager {
    constructor(game) {
        this.game = game;
        this.socket = io();
        this.setupSocketEvents();
    }
    
    setupSocketEvents() {
        // Eventos de conexão e sala
        this.socket.on('roomCreated', (data) => {
            this.game.setRoomInfo(data.roomCode, data.playerId, true);
            this.game.addPlayer(data.playerId, {
                id: data.playerId,
                isHost: true,
                ready: false,
                color: '#ff0000' // Cor padrão até receber do servidor
            });
            this.game.switchScreen('lobby');
        });
        
        this.socket.on('roomJoined', (data) => {
            this.game.setRoomInfo(data.roomCode, data.playerId);
            this.game.updatePlayers(data.players);
            this.game.switchScreen('lobby');
        });
        
        this.socket.on('joinError', (data) => {
            this.game.showError(data.message);
        });
        
        this.socket.on('playerJoined', (data) => {
            this.game.addPlayer(data.playerId, data.playerInfo);
        });
        
        this.socket.on('playerLeft', (data) => {
            this.game.removePlayer(data.playerId);
        });
        
        this.socket.on('playerStatusUpdate', (data) => {
            this.game.updatePlayerStatus(data.playerId, data.ready);
        });
        
        this.socket.on('newHost', (data) => {
            this.game.setNewHost(data.playerId);
        });
        
        // Eventos de jogo
        this.socket.on('gameStart', (data) => {
            this.game.startGame(data.countdown);
        });
        
        this.socket.on('playerMoved', (data) => {
            if (this.game.gameScreen.cars[data.playerId]) {
                this.game.gameScreen.updateCarPosition(data.playerId, data.position, data.rotation);
            }
        });
        
        this.socket.on('progressUpdate', (data) => {
            if (this.game.gameScreen.cars[data.playerId]) {
                this.game.gameScreen.updateCarProgress(data.playerId, data.lap, data.checkpoint);
            }
        });
        
        this.socket.on('playerFinished', (data) => {
            this.game.gameScreen.playerFinished(data.playerId);
        });
    }
    
    // Métodos para enviar dados ao servidor
    createRoom() {
        this.socket.emit('createRoom');
    }
    
    joinRoom(roomCode) {
        this.socket.emit('joinRoom', { roomCode });
    }
    
    setReady(ready) {
        this.socket.emit('playerReady', ready);
    }
    
    updatePosition(position, rotation) {
        this.socket.emit('updatePosition', { position, rotation });
    }
    
    updateProgress(lap, checkpoint) {
        this.socket.emit('updateProgress', { lap, checkpoint });
    }
}