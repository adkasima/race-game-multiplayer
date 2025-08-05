// Módulo principal do jogo
import { MenuScreen } from './screens/menu.js';
import { LobbyScreen } from './screens/lobby.js';
import { GameScreen } from './screens/game.js';
import { EndScreen } from './screens/end.js';
import { SocketManager } from './network/socket-manager.js';

class Game {
    constructor() {
        // Inicializar gerenciador de socket
        this.socketManager = new SocketManager(this);
        
        // Inicializar telas
        this.menuScreen = new MenuScreen(this);
        this.lobbyScreen = new LobbyScreen(this);
        this.gameScreen = new GameScreen(this);
        this.endScreen = new EndScreen(this);
        
        // Estado do jogo
        this.currentScreen = 'menu';
        this.roomCode = null;
        this.playerId = null;
        this.players = {};
        this.isHost = false;
        this.isReady = false;
        
        // Inicializar o jogo
        this.init();
        
        // Verificar se há um elemento de erro, se não, criar um
        if (!document.getElementById('error-message')) {
            const errorElement = document.createElement('div');
            errorElement.id = 'error-message';
            errorElement.className = 'hidden';
            document.body.appendChild(errorElement);
        }
    }
    
    init() {
        // Configurar eventos de botões do menu
        document.getElementById('create-room-btn').addEventListener('click', () => {
            this.socketManager.createRoom();
        });
        
        document.getElementById('join-room-btn').addEventListener('click', () => {
            const roomCode = document.getElementById('room-code-input').value.trim();
            if (roomCode.length === 4) {
                this.socketManager.joinRoom(roomCode);
            } else {
                this.showError('Código da sala deve ter 4 caracteres!');
            }
        });
        
        document.getElementById('ready-btn').addEventListener('click', () => {
            this.isReady = !this.isReady;
            this.socketManager.setReady(this.isReady);
            document.getElementById('ready-btn').textContent = this.isReady ? 'Cancelar' : 'Pronto';
        });
        
        document.getElementById('back-to-menu-btn').addEventListener('click', () => {
            this.switchScreen('menu');
        });
        
        document.getElementById('restart-game-btn').addEventListener('click', () => {
            this.socketManager.restartGame();
        });
        
        // Configurar entrada de código de sala para maiúsculas
        const roomInput = document.getElementById('room-code-input');
        roomInput.addEventListener('input', () => {
            roomInput.value = roomInput.value.toUpperCase();
        });
    }
    
    switchScreen(screenName) {
        // Ocultar todas as telas
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        
        // Mostrar a tela selecionada
        const screenId = `${screenName}-screen`;
        document.getElementById(screenId).classList.add('active');
        
        this.currentScreen = screenName;
        
        // Ações específicas para cada tela
        if (screenName === 'game') {
            this.gameScreen.start();
        } else if (screenName === 'menu') {
            // Resetar estado do jogo
            this.roomCode = null;
            this.playerId = null;
            this.players = {};
            this.isHost = false;
            this.isReady = false;
            document.getElementById('ready-btn').textContent = 'Pronto';
            document.getElementById('room-code-input').value = '';
        } else if (screenName === 'lobby') {
            // Resetar o estado de pronto
            this.isReady = false;
            document.getElementById('ready-btn').textContent = 'Pronto';
            this.lobbyScreen.updatePlayersList();
        }
    }
    
    showError(message) {
        const errorElement = document.getElementById('error-message');
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.classList.remove('hidden');
            
            // Esconder a mensagem após 3 segundos
            setTimeout(() => {
                errorElement.classList.add('hidden');
            }, 3000);
        } else {
            console.error('Elemento de erro não encontrado:', message);
        }
    }
    
    // Métodos para gerenciar o estado do jogo
    setRoomInfo(roomCode, playerId, isHost = false) {
        this.roomCode = roomCode;
        this.playerId = playerId;
        this.isHost = isHost;
        
        // Atualizar interface
        document.getElementById('room-code-display').textContent = roomCode;
    }
    
    updatePlayers(players) {
        this.players = players;
        this.lobbyScreen.updatePlayersList();
    }
    
    addPlayer(playerId, playerInfo) {
        this.players[playerId] = playerInfo;
        this.lobbyScreen.updatePlayersList();
    }
    
    removePlayer(playerId) {
        if (this.players[playerId]) {
            delete this.players[playerId];
            this.lobbyScreen.updatePlayersList();
        }
    }
    
    updatePlayerStatus(playerId, ready) {
        if (this.players[playerId]) {
            this.players[playerId].ready = ready;
            this.lobbyScreen.updatePlayersList();
        }
    }
    
    setNewHost(playerId) {
        // Atualizar host anterior
        Object.values(this.players).forEach(player => {
            player.isHost = false;
        });
        
        // Definir novo host
        if (this.players[playerId]) {
            this.players[playerId].isHost = true;
            this.isHost = (playerId === this.playerId);
        }
        
        this.lobbyScreen.updatePlayersList();
    }
    
    startGame(countdown) {
        this.switchScreen('game');
        this.gameScreen.startCountdown(countdown);
    }
    
    endGame(scores, winner) {
        this.endScreen.showResults(scores, winner);
        this.switchScreen('end');
    }
    
    // Método para obter a cor do jogador atual
    getCurrentPlayerColor() {
        if (this.playerId && this.players[this.playerId]) {
            return this.players[this.playerId].color;
        }
        return '#ffffff'; // Cor padrão caso não encontre
    }
    
    // Método para obter a posição do jogador atual
    getCurrentPlayerPosition() {
        if (this.playerId && this.players[this.playerId]) {
            return this.players[this.playerId].position;
        }
        return { x: 0, y: 0 }; // Posição padrão
    }
}

// Iniciar o jogo quando a página carregar
window.addEventListener('load', () => {
    window.game = new Game();
});