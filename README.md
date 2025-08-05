# Jogo de Corrida Multiplayer

Este é um jogo de corrida multiplayer com sistema de salas onde jogadores podem se conectar através de um código e competir em corridas.

## Funcionalidades

- Sistema de salas com códigos de acesso
- Suporte a múltiplos jogadores
- Corrida em tempo real com 3 voltas
- Sistema de posições e checkpoints
- Resultados ao final da corrida

## Tecnologias Utilizadas

- **Frontend**: HTML5, CSS3, JavaScript (Canvas para renderização)
- **Backend**: Node.js, Express
- **Comunicação em tempo real**: Socket.IO

## Como Instalar

1. Certifique-se de ter o Node.js instalado (versão 14 ou superior)
2. Clone este repositório
3. Instale as dependências:

```bash
npm install
```

## Como Executar

1. Inicie o servidor:

```bash
npm start
```

2. Acesse o jogo em seu navegador: `http://localhost:3000`

## Como Jogar

1. Na tela inicial, você pode criar uma nova sala ou entrar em uma sala existente usando um código
2. Compartilhe o código da sala com seus amigos para que eles possam se juntar
3. Quando todos estiverem prontos, a corrida começará automaticamente
4. Use as setas do teclado para controlar seu carro:
   - Seta para cima: Acelerar
   - Seta para baixo: Frear/Ré
   - Seta para esquerda/direita: Virar
5. Complete 3 voltas para terminar a corrida

## Deploy

Para disponibilizar o jogo online para seus amigos, você pode fazer o deploy em plataformas como:

- [Heroku](https://www.heroku.com/)
- [Render](https://render.com/)
- [Railway](https://railway.app/)
- [Vercel](https://vercel.com/) (com adaptações para o backend)

Escolha uma dessas plataformas, siga as instruções de deploy e compartilhe o link com seus amigos.

## Estrutura do Projeto

- `server.js`: Servidor principal e lógica de comunicação
- `public/`: Arquivos do cliente
  - `index.html`: Estrutura da página
  - `style.css`: Estilos da interface
  - `js/`: Scripts do cliente
    - `game.js`: Ponto de entrada do jogo
    - `network/`: Módulos de comunicação
    - `screens/`: Telas do jogo (menu, lobby, game, end)