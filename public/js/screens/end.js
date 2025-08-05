// Tela de fim de jogo
export class EndScreen {
    constructor(game) {
        this.game = game;
        this.resultsContainer = document.getElementById('results-container');
    }
    
    showResults(finishedPlayers) {
        // Limpar resultados anteriores
        this.resultsContainer.innerHTML = '';
        
        // Mostrar resultados em ordem de chegada
        finishedPlayers.forEach((playerId, index) => {
            const playerInfo = this.game.players[playerId];
            if (!playerInfo) return;
            
            const resultItem = document.createElement('div');
            resultItem.className = 'result-item';
            
            // Posição
            const position = document.createElement('span');
            position.className = 'position-number';
            position.textContent = `${index + 1}º`;
            resultItem.appendChild(position);
            
            // Informações do jogador
            const playerInfoElement = document.createElement('div');
            playerInfoElement.className = 'player-info';
            
            // Cor do jogador
            const playerColor = document.createElement('span');
            playerColor.className = 'player-color';
            playerColor.style.backgroundColor = this.game.players[playerId].color;
            playerInfoElement.appendChild(playerColor);
            
            // Nome do jogador
            const playerName = document.createElement('span');
            playerName.textContent = `Jogador ${playerId.substring(0, 4)}`;
            playerInfoElement.appendChild(playerName);
            
            resultItem.appendChild(playerInfoElement);
            
            // Adicionar à lista de resultados
            this.resultsContainer.appendChild(resultItem);
        });
        
        // Adicionar jogadores que não terminaram a corrida
        const notFinished = Object.keys(this.game.players).filter(
            id => !finishedPlayers.includes(id)
        );
        
        if (notFinished.length > 0) {
            const separator = document.createElement('div');
            separator.style.margin = '10px 0';
            separator.style.borderTop = '1px solid #555';
            this.resultsContainer.appendChild(separator);
            
            const notFinishedTitle = document.createElement('div');
            notFinishedTitle.style.textAlign = 'center';
            notFinishedTitle.style.margin = '10px 0';
            notFinishedTitle.textContent = 'Não completaram';
            this.resultsContainer.appendChild(notFinishedTitle);
            
            notFinished.forEach(playerId => {
                const resultItem = document.createElement('div');
                resultItem.className = 'result-item';
                
                // Posição
                const position = document.createElement('span');
                position.className = 'position-number';
                position.textContent = '-';
                resultItem.appendChild(position);
                
                // Informações do jogador
                const playerInfoElement = document.createElement('div');
                playerInfoElement.className = 'player-info';
                
                // Cor do jogador
                const playerColor = document.createElement('span');
                playerColor.className = 'player-color';
                playerColor.style.backgroundColor = this.game.players[playerId].color;
                playerInfoElement.appendChild(playerColor);
                
                // Nome do jogador
                const playerName = document.createElement('span');
                playerName.textContent = `Jogador ${playerId.substring(0, 4)}`;
                playerInfoElement.appendChild(playerName);
                
                resultItem.appendChild(playerInfoElement);
                
                // Adicionar à lista de resultados
                this.resultsContainer.appendChild(resultItem);
            });
        }
    }
}