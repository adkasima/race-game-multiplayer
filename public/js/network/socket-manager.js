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
        
        this.socket.on('gameGridInitialized', (data) => {
            this.game.gameScreen.initializeGrid(data.grid);
        });
        
        this.socket.on('playerMoved', (data) => {
            this.game.gameScreen.updatePlayerPosition(data.playerId, data.position);
        });
        
        this.socket.on('gridUpdated', (data) => {
            this.game.gameScreen.updateGridCell(data.x, data.y, data.color);
        });
        
        this.socket.on('scoresUpdated', (data) => {
            this.game.gameScreen.updateScores(data);
        });
        
        this.socket.on('timeUpdated', (data) => {
            this.game.gameScreen.updateTime(data.timeLeft);
        });
        
        this.socket.on('gameEnded', (data) => {
            this.game.endGame(data.scores, data.winner);
        });
        
        this.socket.on('gameRestarted', () => {
            this.game.switchScreen('lobby');
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
    
    movePlayer(position) {
        this.socket.emit('movePlayer', { position });
    }
    
    restartGame() {
        this.socket.emit('restartGame');
    }
}