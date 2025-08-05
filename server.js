const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// Porta do servidor
const PORT = process.env.PORT || 3001;

// Servir arquivos estáticos da pasta public
app.use(express.static(path.join(__dirname, 'public')));

// Armazenar informações das salas e jogadores
const rooms = {};

// Configuração do Socket.IO
io.on('connection', (socket) => {
  console.log('Novo jogador conectado:', socket.id);

  // Criar uma nova sala
  socket.on('createRoom', () => {
    const roomCode = generateRoomCode();
    rooms[roomCode] = {
      id: roomCode,
      players: {},
      host: socket.id,
      gameStarted: false,
      grid: createEmptyGrid(16, 16),
      gameTimer: null,
      timeLeft: 30
    };

    socket.join(roomCode);
    socket.roomCode = roomCode;
    
    // Adicionar o host como jogador
    rooms[roomCode].players[socket.id] = {
      id: socket.id,
      isHost: true,
      ready: false,
      position: { x: 0, y: 0 },
      color: getRandomColor(),
      score: 0
    };

    socket.emit('roomCreated', { roomCode, playerId: socket.id });
    console.log(`Sala criada: ${roomCode}`);
  });

  // Entrar em uma sala existente
  socket.on('joinRoom', (data) => {
    const roomCode = data.roomCode.toUpperCase();
    
    if (!rooms[roomCode]) {
      socket.emit('joinError', { message: 'Sala não encontrada!' });
      return;
    }

    if (rooms[roomCode].gameStarted) {
      socket.emit('joinError', { message: 'Jogo já iniciado!' });
      return;
    }

    socket.join(roomCode);
    socket.roomCode = roomCode;

    // Adicionar jogador à sala
    rooms[roomCode].players[socket.id] = {
      id: socket.id,
      isHost: false,
      ready: false,
      position: { x: 0, y: 0 },
      color: getRandomColor(),
      score: 0
    };

    socket.emit('roomJoined', { 
      roomCode, 
      playerId: socket.id,
      players: rooms[roomCode].players 
    });

    // Notificar outros jogadores na sala
    socket.to(roomCode).emit('playerJoined', { 
      playerId: socket.id, 
      playerInfo: rooms[roomCode].players[socket.id] 
    });

    console.log(`Jogador ${socket.id} entrou na sala ${roomCode}`);
  });

  // Jogador pronto para iniciar
  socket.on('playerReady', (ready) => {
    const roomCode = socket.roomCode;
    if (!roomCode || !rooms[roomCode] || !rooms[roomCode].players[socket.id]) return;

    rooms[roomCode].players[socket.id].ready = ready;
    io.to(roomCode).emit('playerStatusUpdate', { 
      playerId: socket.id, 
      ready: ready 
    });

    // Verificar se todos estão prontos
    const allPlayers = Object.values(rooms[roomCode].players);
    const allReady = allPlayers.length >= 2 && allPlayers.every(player => player.ready);
    
    if (allReady && !rooms[roomCode].gameStarted) {
      rooms[roomCode].gameStarted = true;
      io.to(roomCode).emit('gameStart', { countdown: 3 });
      console.log(`Jogo iniciado na sala ${roomCode}`);
      
      // Iniciar o temporizador do jogo após a contagem regressiva (3 segundos)
      setTimeout(() => {
        startGameTimer(roomCode);
      }, 3000);
    }
  });

  // Atualização da posição do jogador
  socket.on('movePlayer', (data) => {
    const roomCode = socket.roomCode;
    if (!roomCode || !rooms[roomCode] || !rooms[roomCode].players[socket.id] || !rooms[roomCode].gameStarted) return;

    const player = rooms[roomCode].players[socket.id];
    const newPosition = {
      x: Math.max(0, Math.min(15, data.position.x)),
      y: Math.max(0, Math.min(15, data.position.y))
    };
    
    player.position = newPosition;
    
    // Pintar a célula com a cor do jogador
    const cell = rooms[roomCode].grid[newPosition.y][newPosition.x];
    if (cell.color !== player.color) {
      // Se a célula já tinha uma cor de outro jogador, diminuir a pontuação desse jogador
      if (cell.color !== null) {
        const previousOwner = Object.values(rooms[roomCode].players).find(p => p.color === cell.color);
        if (previousOwner) {
          previousOwner.score--;
        }
      }
      
      // Atualizar a célula com a cor do jogador atual
      cell.color = player.color;
      player.score++;
      
      // Enviar atualização do grid para todos os jogadores na sala
      io.to(roomCode).emit('gridUpdated', {
        x: newPosition.x,
        y: newPosition.y,
        color: player.color
      });
      
      // Enviar atualização das pontuações
      io.to(roomCode).emit('scoresUpdated', getPlayerScores(roomCode));
    }
    
    // Enviar atualização da posição para outros jogadores na sala
    socket.to(roomCode).emit('playerMoved', {
      playerId: socket.id,
      position: newPosition
    });
  });
  
  // Reiniciar o jogo na mesma sala
  socket.on('restartGame', () => {
    const roomCode = socket.roomCode;
    if (!roomCode || !rooms[roomCode]) return;
    
    // Verificar se o jogador é o host
    if (rooms[roomCode].host !== socket.id) {
      socket.emit('joinError', { message: 'Apenas o host pode reiniciar o jogo!' });
      return;
    }
    
    // Resetar o estado do jogo
    rooms[roomCode].gameStarted = false;
    rooms[roomCode].grid = createEmptyGrid(16, 16);
    
    // Resetar o estado dos jogadores
    for (const playerId in rooms[roomCode].players) {
      rooms[roomCode].players[playerId].ready = false;
      rooms[roomCode].players[playerId].score = 0;
      rooms[roomCode].players[playerId].position = { x: 0, y: 0 };
    }
    
    // Notificar todos os jogadores que o jogo foi reiniciado
    io.to(roomCode).emit('gameRestarted');
    console.log(`Jogo reiniciado na sala ${roomCode}`);
  });

  // Desconexão do jogador
  socket.on('disconnect', () => {
    const roomCode = socket.roomCode;
    if (roomCode && rooms[roomCode]) {
      // Remover jogador da sala
      if (rooms[roomCode].players[socket.id]) {
        delete rooms[roomCode].players[socket.id];
        
        // Notificar outros jogadores
        socket.to(roomCode).emit('playerLeft', { playerId: socket.id });
        
        // Se era o host, escolher novo host ou fechar a sala
        if (rooms[roomCode].host === socket.id) {
          const remainingPlayers = Object.keys(rooms[roomCode].players);
          if (remainingPlayers.length > 0) {
            const newHost = remainingPlayers[0];
            rooms[roomCode].host = newHost;
            rooms[roomCode].players[newHost].isHost = true;
            io.to(roomCode).emit('newHost', { playerId: newHost });
          } else {
            // Limpar o temporizador se a sala for fechada
            if (rooms[roomCode].gameTimer) {
              clearInterval(rooms[roomCode].gameTimer);
            }
            delete rooms[roomCode];
          }
        }
        
        // Se o jogo já começou e não há jogadores suficientes, encerrar o jogo
        if (rooms[roomCode] && rooms[roomCode].gameStarted && Object.keys(rooms[roomCode].players).length < 2) {
          endGame(roomCode);
        }
      }
    }
    console.log('Jogador desconectado:', socket.id);
  });
});

// Criar um grid vazio
function createEmptyGrid(width, height) {
  const grid = [];
  for (let y = 0; y < height; y++) {
    const row = [];
    for (let x = 0; x < width; x++) {
      row.push({ color: null });
    }
    grid.push(row);
  }
  return grid;
}

// Iniciar o temporizador do jogo
function startGameTimer(roomCode) {
  const room = rooms[roomCode];
  if (!room) return;
  
  room.timeLeft = 30; // 30 segundos de jogo
  
  // Enviar o grid inicial para todos os jogadores
  io.to(roomCode).emit('gameGridInitialized', { grid: room.grid });
  
  // Atualizar o tempo a cada segundo
  room.gameTimer = setInterval(() => {
    room.timeLeft--;
    
    // Enviar atualização do tempo para todos os jogadores
    io.to(roomCode).emit('timeUpdated', { timeLeft: room.timeLeft });
    
    // Verificar se o tempo acabou
    if (room.timeLeft <= 0) {
      endGame(roomCode);
    }
  }, 1000);
}

// Encerrar o jogo e calcular o vencedor
function endGame(roomCode) {
  const room = rooms[roomCode];
  if (!room) return;
  
  // Parar o temporizador
  if (room.gameTimer) {
    clearInterval(room.gameTimer);
    room.gameTimer = null;
  }
  
  // Calcular pontuações finais
  const scores = getPlayerScores(roomCode);
  
  // Determinar o vencedor
  let winner = null;
  let maxScore = -1;
  
  for (const score of scores) {
    if (score.score > maxScore) {
      maxScore = score.score;
      winner = score.playerId;
    }
  }
  
  // Enviar resultados para todos os jogadores
  io.to(roomCode).emit('gameEnded', { 
    scores: scores,
    winner: winner
  });
  
  // Resetar o estado do jogo
  room.gameStarted = false;
  room.grid = createEmptyGrid(16, 16);
  
  // Resetar o estado dos jogadores
  for (const playerId in room.players) {
    room.players[playerId].ready = false;
    room.players[playerId].score = 0;
    room.players[playerId].position = { x: 0, y: 0 };
  }
  
  console.log(`Jogo encerrado na sala ${roomCode}. Vencedor: ${winner}`);
}

// Obter as pontuações de todos os jogadores em uma sala
function getPlayerScores(roomCode) {
  const room = rooms[roomCode];
  if (!room) return [];
  
  return Object.values(room.players).map(player => ({
    playerId: player.id,
    color: player.color,
    score: player.score
  }));
}

// Gerar código de sala aleatório (4 letras)
function generateRoomCode() {
  let code;
  do {
    code = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for (let i = 0; i < 4; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
  } while (rooms[code]); // Garantir que o código seja único
  
  return code;
}

// Gerar cor aleatória para o jogador
function getRandomColor() {
  const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];
  return colors[Math.floor(Math.random() * colors.length)];
}

// Iniciar o servidor
server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});