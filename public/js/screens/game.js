// Tela de jogo principal para o jogo de conquista de território
export class GameScreen {
    constructor(game) {
        this.game = game;
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.countdownElement = document.getElementById('countdown');
        this.playerScoresElement = document.getElementById('player-scores');
        
        // Configurações do jogo
        this.grid = [];
        this.gridSize = 16;
        this.cellSize = 30;
        this.players = {};
        this.timeLeft = 30;
        
        // Controles
        this.keys = {
            up: false,
            down: false,
            left: false,
            right: false
        };
        
        // Configurar eventos de teclado
        this.setupControls();
    }
    
    setupControls() {
        // Eventos de teclado para controlar o jogador
        window.addEventListener('keydown', (e) => {
            if (this.game.currentScreen !== 'game') return;
            
            switch(e.key) {
                case 'ArrowUp':
                    this.keys.up = true;
                    this.movePlayer(0, -1);
                    break;
                case 'ArrowDown':
                    this.keys.down = true;
                    this.movePlayer(0, 1);
                    break;
                case 'ArrowLeft':
                    this.keys.left = true;
                    this.movePlayer(-1, 0);
                    break;
                case 'ArrowRight':
                    this.keys.right = true;
                    this.movePlayer(1, 0);
                    break;
            }
        });
        
        window.addEventListener('keyup', (e) => {
            if (this.game.currentScreen !== 'game') return;
            
            switch(e.key) {
                case 'ArrowUp':
                    this.keys.up = false;
                    break;
                case 'ArrowDown':
                    this.keys.down = false;
                    break;
                case 'ArrowLeft':
                    this.keys.left = false;
                    break;
                case 'ArrowRight':
                    this.keys.right = false;
                    break;
            }
        });
    }
    
    start() {
        // Ajustar tamanho do canvas
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        
        // Iniciar loop de jogo
        this.gameLoop();
    }
    
    resizeCanvas() {
        // Definir tamanho do canvas para acomodar o grid 16x16
        const gridPixelSize = this.gridSize * this.cellSize;
        this.canvas.width = gridPixelSize;
        this.canvas.height = gridPixelSize;
    }
    
    // Inicializar o grid com os dados recebidos do servidor
    initializeGrid(gridData) {
        this.grid = gridData;
        this.render();
    }
    
    startCountdown(seconds) {
        this.countdownElement.textContent = seconds;
        
        const countdownInterval = setInterval(() => {
            seconds--;
            
            if (seconds > 0) {
                this.countdownElement.textContent = seconds;
            } else {
                this.countdownElement.textContent = 'GO!';
                setTimeout(() => {
                    this.countdownElement.textContent = '30';
                }, 1000);
                clearInterval(countdownInterval);
            }
        }, 1000);
    }
    
    gameLoop() {
        if (this.game.currentScreen !== 'game') return;
        
        // Renderizar o jogo
        this.render();
        
        // Continuar o loop
        requestAnimationFrame(() => this.gameLoop());
    }
    
    movePlayer(dx, dy) {
        // Obter a posição atual do jogador
        const currentPosition = this.game.getCurrentPlayerPosition();
        
        // Calcular nova posição
        const newPosition = {
            x: Math.max(0, Math.min(this.gridSize - 1, currentPosition.x + dx)),
            y: Math.max(0, Math.min(this.gridSize - 1, currentPosition.y + dy))
        };
        
        // Enviar a nova posição para o servidor
        this.game.socketManager.movePlayer(newPosition);
    }
    
    // Atualizar o grid com os dados recebidos do servidor
    updateGrid(gridData) {
        this.grid = gridData;
        this.render();
    }
    
    // Atualizar o tempo restante
    updateTime(timeLeft) {
        this.timeLeft = timeLeft;
        this.countdownElement.textContent = timeLeft;
    }
    
    // Atualizar as pontuações dos jogadores
    updateScores(scores) {
        // Limpar o elemento de pontuações
        this.playerScoresElement.innerHTML = '';
        
        // Adicionar as pontuações de cada jogador
        Object.entries(scores).forEach(([playerId, score]) => {
            const player = this.game.players[playerId];
            if (!player) return;
            
            const scoreElement = document.createElement('div');
            scoreElement.className = 'player-score';
            scoreElement.innerHTML = `
                <div class="player-color" style="background-color: ${player.color}"></div>
                <div class="player-name">${player.name}</div>
                <div class="player-score-value">${score}</div>
            `;
            
            this.playerScoresElement.appendChild(scoreElement);
        });
    }
    
    // Renderizar o grid e os jogadores
    render() {
        if (!this.grid || !this.grid.length) return;
        
        // Limpar o canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Desenhar o grid
        for (let y = 0; y < this.gridSize; y++) {
            for (let x = 0; x < this.gridSize; x++) {
                const cell = this.grid[y][x];
                const cellX = x * this.cellSize;
                const cellY = y * this.cellSize;
                
                // Desenhar a célula com a cor do jogador ou cinza se não tiver dono
                if (cell) {
                    const player = this.game.players[cell];
                    if (player) {
                        this.ctx.fillStyle = player.color;
                    } else {
                        this.ctx.fillStyle = '#cccccc';
                    }
                } else {
                    this.ctx.fillStyle = '#eeeeee';
                }
                
                this.ctx.fillRect(cellX, cellY, this.cellSize, this.cellSize);
                
                // Desenhar borda da célula
                this.ctx.strokeStyle = '#999999';
                this.ctx.lineWidth = 1;
                this.ctx.strokeRect(cellX, cellY, this.cellSize, this.cellSize);
            }
        }
        
        // Desenhar os jogadores nas suas posições atuais
        Object.entries(this.game.players).forEach(([playerId, playerInfo]) => {
            if (!playerInfo.position) return;
            
            const x = playerInfo.position.x * this.cellSize + this.cellSize / 2;
            const y = playerInfo.position.y * this.cellSize + this.cellSize / 2;
            
            // Desenhar um círculo representando o jogador
            this.ctx.beginPath();
            this.ctx.arc(x, y, this.cellSize / 3, 0, Math.PI * 2);
            this.ctx.fillStyle = playerInfo.color;
            this.ctx.fill();
            this.ctx.strokeStyle = '#000000';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
            
            // Desenhar inicial do nome do jogador
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = `${this.cellSize / 3}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(playerInfo.name.charAt(0).toUpperCase(), x, y);
        });
    }
}