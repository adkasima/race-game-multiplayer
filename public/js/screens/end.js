// Tela de fim de jogo para o jogo de conquista de território
export class EndScreen {
    constructor(game) {
        this.game = game;
        this.resultsContainer = document.getElementById('results-container');
    }
    
    showResults(scores, winner) {
        // Limpar resultados anteriores
        this.resultsContainer.innerHTML = '';
        
        // Título do vencedor
        const winnerTitle = document.createElement('div');
        winnerTitle.className = 'winner-title';
        winnerTitle.textContent = 'Vencedor!';
        this.resultsContainer.appendChild(winnerTitle);
        
        // Mostrar o vencedor
        if (winner && this.game.players[winner]) {
            const winnerItem = document.createElement('div');
            winnerItem.className = 'result-item winner';
            
            // Posição
            const position = document.createElement('span');
            position.className = 'position-number';
            position.textContent = '1º';
            winnerItem.appendChild(position);
            
            // Informações do jogador
            const playerInfoElement = document.createElement('div');
            playerInfoElement.className = 'player-info';
            
            // Cor do jogador
            const playerColor = document.createElement('span');
            playerColor.className = 'player-color';
            playerColor.style.backgroundColor = this.game.players[winner].color;
            playerInfoElement.appendChild(playerColor);
            
            // Nome do jogador
            const playerName = document.createElement('span');
            playerName.textContent = this.game.players[winner].name || `Jogador ${winner.substring(0, 4)}`;
            playerInfoElement.appendChild(playerName);
            
            // Pontuação
            const scoreElement = document.createElement('span');
            scoreElement.className = 'player-score';
            scoreElement.textContent = `${scores[winner] || 0} células`;
            playerInfoElement.appendChild(scoreElement);
            
            winnerItem.appendChild(playerInfoElement);
            
            // Adicionar à lista de resultados
            this.resultsContainer.appendChild(winnerItem);
        }
        
        // Título dos outros jogadores
        const othersTitle = document.createElement('div');
        othersTitle.className = 'others-title';
        othersTitle.textContent = 'Classificação';
        this.resultsContainer.appendChild(othersTitle);
        
        // Ordenar jogadores por pontuação
        const sortedPlayers = Object.entries(scores)
            .filter(([playerId]) => playerId !== winner)
            .sort(([, scoreA], [, scoreB]) => scoreB - scoreA);
        
        // Mostrar resultados em ordem de pontuação
        sortedPlayers.forEach(([playerId, score], index) => {
            const playerInfo = this.game.players[playerId];
            if (!playerInfo) return;
            
            const resultItem = document.createElement('div');
            resultItem.className = 'result-item';
            
            // Posição
            const position = document.createElement('span');
            position.className = 'position-number';
            position.textContent = `${index + 2}º`;
            resultItem.appendChild(position);
            
            // Informações do jogador
            const playerInfoElement = document.createElement('div');
            playerInfoElement.className = 'player-info';
            
            // Cor do jogador
            const playerColor = document.createElement('span');
            playerColor.className = 'player-color';
            playerColor.style.backgroundColor = playerInfo.color;
            playerInfoElement.appendChild(playerColor);
            
            // Nome do jogador
            const playerName = document.createElement('span');
            playerName.textContent = playerInfo.name || `Jogador ${playerId.substring(0, 4)}`;
            playerInfoElement.appendChild(playerName);
            
            // Pontuação
            const scoreElement = document.createElement('span');
            scoreElement.className = 'player-score';
            scoreElement.textContent = `${score || 0} células`;
            playerInfoElement.appendChild(scoreElement);
            
            resultItem.appendChild(playerInfoElement);
            
            // Adicionar à lista de resultados
            this.resultsContainer.appendChild(resultItem);
        });
    }
}