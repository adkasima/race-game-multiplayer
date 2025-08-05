// Tela de menu principal para o jogo de conquista de território
export class MenuScreen {
    constructor(game) {
        this.game = game;
        
        // Elementos do menu
        this.createRoomBtn = document.getElementById('create-room-btn');
        this.joinRoomBtn = document.getElementById('join-room-btn');
        this.roomCodeInput = document.getElementById('room-code-input');
        this.playerNameInput = document.getElementById('player-name-input');
        
        // Configurar eventos
        this.setupEvents();
    }
    
    setupEvents() {
        // Evento para criar sala
        this.createRoomBtn.addEventListener('click', () => {
            const playerName = this.playerNameInput.value.trim() || 'Jogador';
            this.game.socketManager.createRoom(playerName);
        });
        
        // Evento para entrar em uma sala
        this.joinRoomBtn.addEventListener('click', () => {
            const roomCode = this.roomCodeInput.value.trim();
            const playerName = this.playerNameInput.value.trim() || 'Jogador';
            
            if (roomCode) {
                this.game.socketManager.joinRoom(roomCode, playerName);
            } else {
                alert('Por favor, insira um código de sala válido.');
            }
        });
        
        // Evento para entrar em uma sala ao pressionar Enter no input de código
        this.roomCodeInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const roomCode = this.roomCodeInput.value.trim();
                const playerName = this.playerNameInput.value.trim() || 'Jogador';
                
                if (roomCode) {
                    this.game.socketManager.joinRoom(roomCode, playerName);
                } else {
                    alert('Por favor, insira um código de sala válido.');
                }
            }
        });
    }
}