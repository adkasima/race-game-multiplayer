// Tela de jogo principal
export class GameScreen {
    constructor(game) {
        this.game = game;
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.lapCounter = document.getElementById('lap-counter');
        this.positionDisplay = document.getElementById('position-display');
        this.countdownElement = document.getElementById('countdown');
        
        // Configurações do jogo
        this.cars = {};
        this.track = null;
        this.checkpoints = [];
        this.finishedPlayers = [];
        
        // Controles
        this.keys = {
            up: false,
            down: false,
            left: false,
            right: false
        };
        
        // Configurar eventos de teclado
        this.setupControls();
        
        // Criar pista e checkpoints
        this.createTrack();
    }
    
    setupControls() {
        // Eventos de teclado para controlar o carro
        window.addEventListener('keydown', (e) => {
            if (this.game.currentScreen !== 'game') return;
            
            switch(e.key) {
                case 'ArrowUp':
                    this.keys.up = true;
                    break;
                case 'ArrowDown':
                    this.keys.down = true;
                    break;
                case 'ArrowLeft':
                    this.keys.left = true;
                    break;
                case 'ArrowRight':
                    this.keys.right = true;
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
    
    createTrack() {
        // Definir formato da pista (pontos que formam o caminho)
        this.track = [
            { x: 150, y: 100 },
            { x: 850, y: 100 },
            { x: 850, y: 500 },
            { x: 150, y: 500 }
        ];
        
        // Definir checkpoints ao longo da pista
        this.checkpoints = [
            { x: 500, y: 100, width: 20, height: 50 }, // Checkpoint 0 (linha de chegada)
            { x: 850, y: 300, width: 50, height: 20 }, // Checkpoint 1
            { x: 500, y: 500, width: 20, height: 50 }, // Checkpoint 2
            { x: 150, y: 300, width: 50, height: 20 }  // Checkpoint 3
        ];
    }
    
    start() {
        // Ajustar tamanho do canvas
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        
        // Criar carros para todos os jogadores
        this.cars = {};
        Object.entries(this.game.players).forEach(([playerId, playerInfo]) => {
            this.cars[playerId] = {
                position: playerInfo.position || { x: 500, y: 150 },
                rotation: playerInfo.rotation || 0,
                speed: 0,
                acceleration: 0,
                color: playerInfo.color,
                lap: 0,
                checkpoint: 0,
                finished: false
            };
        });
        
        // Iniciar loop de jogo
        this.gameLoop();
    }
    
    resizeCanvas() {
        const container = document.getElementById('game-screen');
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;
    }
    
    startCountdown(seconds) {
        this.countdownElement.textContent = seconds;
        this.countdownElement.style.display = 'block';
        
        const countdownInterval = setInterval(() => {
            seconds--;
            
            if (seconds > 0) {
                this.countdownElement.textContent = seconds;
            } else {
                this.countdownElement.textContent = 'GO!';
                setTimeout(() => {
                    this.countdownElement.style.display = 'none';
                }, 1000);
                clearInterval(countdownInterval);
            }
        }, 1000);
    }
    
    gameLoop() {
        if (this.game.currentScreen !== 'game') return;
        
        // Atualizar posição do carro do jogador
        this.updatePlayerCar();
        
        // Verificar colisões e checkpoints
        this.checkCollisions();
        
        // Renderizar o jogo
        this.render();
        
        // Atualizar informações de corrida
        this.updateRaceInfo();
        
        // Continuar o loop
        requestAnimationFrame(() => this.gameLoop());
    }
    
    updatePlayerCar() {
        const car = this.cars[this.game.playerId];
        if (!car || car.finished) return;
        
        // Atualizar aceleração com base nas teclas pressionadas
        if (this.keys.up) {
            car.acceleration = 0.2;
        } else if (this.keys.down) {
            car.acceleration = -0.1;
        } else {
            car.acceleration = 0;
        }
        
        // Atualizar velocidade com base na aceleração
        car.speed += car.acceleration;
        
        // Aplicar atrito
        car.speed *= 0.95;
        
        // Limitar velocidade
        car.speed = Math.max(-3, Math.min(5, car.speed));
        
        // Atualizar rotação com base nas teclas pressionadas
        if (this.keys.left) {
            car.rotation -= 0.05 * Math.abs(car.speed);
        }
        if (this.keys.right) {
            car.rotation += 0.05 * Math.abs(car.speed);
        }
        
        // Atualizar posição com base na velocidade e rotação
        car.position.x += Math.cos(car.rotation) * car.speed;
        car.position.y += Math.sin(car.rotation) * car.speed;
        
        // Enviar atualização para o servidor
        this.game.socketManager.updatePosition(car.position, car.rotation);
    }
    
    checkCollisions() {
        const car = this.cars[this.game.playerId];
        if (!car || car.finished) return;
        
        // Verificar colisão com as bordas da tela
        if (car.position.x < 20) car.position.x = 20;
        if (car.position.y < 20) car.position.y = 20;
        if (car.position.x > this.canvas.width - 20) car.position.x = this.canvas.width - 20;
        if (car.position.y > this.canvas.height - 20) car.position.y = this.canvas.height - 20;
        
        // Verificar checkpoints
        const currentCheckpoint = this.checkpoints[car.checkpoint];
        if (this.isCarInCheckpoint(car, currentCheckpoint)) {
            // Avançar para o próximo checkpoint
            car.checkpoint = (car.checkpoint + 1) % this.checkpoints.length;
            
            // Se passou pela linha de chegada (checkpoint 0), incrementar volta
            if (car.checkpoint === 0) {
                car.lap++;
                
                // Verificar se completou a corrida (3 voltas)
                if (car.lap >= 3 && !car.finished) {
                    car.finished = true;
                    this.finishedPlayers.push(this.game.playerId);
                    this.game.socketManager.updateProgress(car.lap, car.checkpoint);
                }
            }
            
            // Enviar progresso para o servidor
            this.game.socketManager.updateProgress(car.lap, car.checkpoint);
        }
    }
    
    isCarInCheckpoint(car, checkpoint) {
        // Verificar se o carro está dentro do checkpoint
        return (
            car.position.x > checkpoint.x - checkpoint.width / 2 &&
            car.position.x < checkpoint.x + checkpoint.width / 2 &&
            car.position.y > checkpoint.y - checkpoint.height / 2 &&
            car.position.y < checkpoint.y + checkpoint.height / 2
        );
    }
    
    updateCarPosition(playerId, position, rotation) {
        if (this.cars[playerId]) {
            this.cars[playerId].position = position;
            this.cars[playerId].rotation = rotation;
        }
    }
    
    updateCarProgress(playerId, lap, checkpoint) {
        if (this.cars[playerId]) {
            this.cars[playerId].lap = lap;
            this.cars[playerId].checkpoint = checkpoint;
            
            // Verificar se o jogador completou a corrida
            if (lap >= 3 && !this.cars[playerId].finished) {
                this.playerFinished(playerId);
            }
        }
    }
    
    playerFinished(playerId) {
        if (this.cars[playerId] && !this.cars[playerId].finished) {
            this.cars[playerId].finished = true;
            this.finishedPlayers.push(playerId);
            
            // Se todos os jogadores terminaram, mostrar resultados
            const allFinished = Object.keys(this.cars).every(id => this.cars[id].finished);
            if (allFinished) {
                setTimeout(() => {
                    this.game.endGame(this.finishedPlayers);
                }, 3000);
            }
        }
    }
    
    updateRaceInfo() {
        const car = this.cars[this.game.playerId];
        if (!car) return;
        
        // Atualizar contador de voltas
        this.lapCounter.textContent = `Volta: ${car.lap}/3`;
        
        // Calcular posição na corrida
        const positions = Object.entries(this.cars)
            .map(([id, carInfo]) => ({
                id,
                progress: carInfo.lap * this.checkpoints.length + carInfo.checkpoint
            }))
            .sort((a, b) => b.progress - a.progress);
        
        const playerPosition = positions.findIndex(pos => pos.id === this.game.playerId) + 1;
        this.positionDisplay.textContent = `Posição: ${playerPosition}/${positions.length}`;
    }
    
    render() {
        // Limpar canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Desenhar pista
        this.drawTrack();
        
        // Desenhar checkpoints
        this.drawCheckpoints();
        
        // Desenhar carros
        this.drawCars();
    }
    
    drawTrack() {
        // Desenhar fundo da pista
        this.ctx.fillStyle = '#333333';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Desenhar pista
        this.ctx.fillStyle = '#666666';
        this.ctx.beginPath();
        this.ctx.moveTo(this.track[0].x, this.track[0].y);
        
        for (let i = 1; i < this.track.length; i++) {
            this.ctx.lineTo(this.track[i].x, this.track[i].y);
        }
        
        this.ctx.closePath();
        this.ctx.fill();
        
        // Desenhar bordas da pista
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 5;
        this.ctx.beginPath();
        this.ctx.moveTo(this.track[0].x, this.track[0].y);
        
        for (let i = 1; i < this.track.length; i++) {
            this.ctx.lineTo(this.track[i].x, this.track[i].y);
        }
        
        this.ctx.closePath();
        this.ctx.stroke();
    }
    
    drawCheckpoints() {
        // Desenhar checkpoints
        for (let i = 0; i < this.checkpoints.length; i++) {
            const checkpoint = this.checkpoints[i];
            
            // Linha de chegada (checkpoint 0) em preto e branco
            if (i === 0) {
                this.ctx.fillStyle = '#ffffff';
                this.ctx.fillRect(
                    checkpoint.x - checkpoint.width / 2,
                    checkpoint.y - checkpoint.height / 2,
                    checkpoint.width,
                    checkpoint.height
                );
                
                // Padrão de linha de chegada
                this.ctx.fillStyle = '#000000';
                const squareSize = 5;
                for (let x = 0; x < checkpoint.width; x += squareSize * 2) {
                    for (let y = 0; y < checkpoint.height; y += squareSize * 2) {
                        this.ctx.fillRect(
                            checkpoint.x - checkpoint.width / 2 + x,
                            checkpoint.y - checkpoint.height / 2 + y,
                            squareSize,
                            squareSize
                        );
                        this.ctx.fillRect(
                            checkpoint.x - checkpoint.width / 2 + x + squareSize,
                            checkpoint.y - checkpoint.height / 2 + y + squareSize,
                            squareSize,
                            squareSize
                        );
                    }
                }
            } else {
                // Outros checkpoints (invisíveis no jogo)
                if (this.game.playerId === Object.keys(this.game.players)[0]) {
                    // Apenas o primeiro jogador vê os checkpoints (para debug)
                    this.ctx.strokeStyle = 'rgba(255, 255, 0, 0.3)';
                    this.ctx.lineWidth = 2;
                    this.ctx.strokeRect(
                        checkpoint.x - checkpoint.width / 2,
                        checkpoint.y - checkpoint.height / 2,
                        checkpoint.width,
                        checkpoint.height
                    );
                }
            }
        }
    }
    
    drawCars() {
        // Desenhar cada carro
        Object.entries(this.cars).forEach(([playerId, car]) => {
            // Salvar contexto
            this.ctx.save();
            
            // Transladar e rotacionar para a posição do carro
            this.ctx.translate(car.position.x, car.position.y);
            this.ctx.rotate(car.rotation);
            
            // Desenhar carro
            this.ctx.fillStyle = car.color;
            this.ctx.fillRect(-15, -10, 30, 20);
            
            // Desenhar detalhes do carro
            this.ctx.fillStyle = '#000000';
            this.ctx.fillRect(10, -8, 5, 16); // Frente
            this.ctx.fillRect(-15, -8, 5, 16); // Traseira
            
            // Destacar carro do jogador
            if (playerId === this.game.playerId) {
                this.ctx.strokeStyle = '#ffffff';
                this.ctx.lineWidth = 2;
                this.ctx.strokeRect(-15, -10, 30, 20);
            }
            
            // Restaurar contexto
            this.ctx.restore();
            
            // Desenhar nome do jogador acima do carro
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = '12px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(`P${playerId.substring(0, 2)}`, car.position.x, car.position.y - 20);
        });
    }
}