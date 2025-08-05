// Tela de sala de espera
export class LobbyScreen {
    constructor(game) {
        this.game = game;
        this.playersContainer = document.getElementById('players-container');
        this.waitingMessage = document.getElementById('waiting-message');
    }
    
    updatePlayersList() {
        // Limpar lista de jogadores
        this.playersContainer.innerHTML = '';
        
        // Adicionar cada jogador à lista
        const players = Object.values(this.game.players);
        players.forEach(player => {
            const playerItem = document.createElement('li');
            playerItem.className = 'player-item';
            
            // Informações do jogador
            const playerInfo = document.createElement('div');
            playerInfo.className = 'player-info';
            
            // Cor do jogador
            const playerColor = document.createElement('span');
            playerColor.className = 'player-color';
            playerColor.style.backgroundColor = player.color;
            playerInfo.appendChild(playerColor);
            
            // Nome do jogador (ID simplificado)
            const playerName = document.createElement('span');
            playerName.textContent = `Jogador ${player.id.substring(0, 4)}`;
            playerInfo.appendChild(playerName);
            
            // Badge de host
            if (player.isHost) {
                const hostBadge = document.createElement('span');
                hostBadge.className = 'host-badge';
                hostBadge.textContent = 'HOST';
                playerInfo.appendChild(hostBadge);
            }
            
            playerItem.appendChild(playerInfo);
            
            // Status do jogador
            const playerStatus = document.createElement('span');
            playerStatus.className = player.ready ? 'player-status ready' : 'player-status not-ready';
            playerStatus.textContent = player.ready ? 'Pronto' : 'Não Pronto';
            playerItem.appendChild(playerStatus);
            
            this.playersContainer.appendChild(playerItem);
        });
        
        // Atualizar mensagem de espera
        const readyCount = players.filter(player => player.ready).length;
        const totalPlayers = players.length;
        
        if (totalPlayers < 2) {
            this.waitingMessage.textContent = 'Aguardando mais jogadores...';
        } else if (readyCount < totalPlayers) {
            this.waitingMessage.textContent = `Aguardando jogadores (${readyCount}/${totalPlayers} prontos)`;
        } else {
            this.waitingMessage.textContent = 'Todos prontos! Iniciando jogo...';
        }
    }
}