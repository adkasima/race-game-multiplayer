const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

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
      gameStarted: false
    };

    socket.join(roomCode);
    socket.roomCode = roomCode;
    
    // Adicionar o host como jogador
    rooms[roomCode].players[socket.id] = {
      id: socket.id,
      isHost: true,
      ready: false,
      position: { x: 50, y: 50 },
      rotation: 0,
      color: getRandomColor(),
      lap: 0,
      checkpoint: 0
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
      position: { x: 50, y: 50 + Object.keys(rooms[roomCode].players).length * 30 },
      rotation: 0,
      color: getRandomColor(),
      lap: 0,
      checkpoint: 0
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
    }
  });

  // Atualização da posição do jogador
  socket.on('updatePosition', (data) => {
    const roomCode = socket.roomCode;
    if (!roomCode || !rooms[roomCode] || !rooms[roomCode].players[socket.id]) return;

    const player = rooms[roomCode].players[socket.id];
    player.position = data.position;
    player.rotation = data.rotation;

    // Enviar atualização para outros jogadores na sala
    socket.to(roomCode).emit('playerMoved', {
      playerId: socket.id,
      position: data.position,
      rotation: data.rotation
    });
  });

  // Atualização de checkpoint/volta
  socket.on('updateProgress', (data) => {
    const roomCode = socket.roomCode;
    if (!roomCode || !rooms[roomCode] || !rooms[roomCode].players[socket.id]) return;

    const player = rooms[roomCode].players[socket.id];
    player.lap = data.lap;
    player.checkpoint = data.checkpoint;

    // Verificar se o jogador completou a corrida (3 voltas)
    if (data.lap >= 3) {
      io.to(roomCode).emit('playerFinished', { playerId: socket.id });
    }

    // Enviar atualização para outros jogadores
    socket.to(roomCode).emit('progressUpdate', {
      playerId: socket.id,
      lap: data.lap,
      checkpoint: data.checkpoint
    });
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
            delete rooms[roomCode];
          }
        }
      }
    }
    console.log('Jogador desconectado:', socket.id);
  });
});

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

// Gerar cor aleatória para o carro
function getRandomColor() {
  const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];
  return colors[Math.floor(Math.random() * colors.length)];
}

// Iniciar o servidor
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});