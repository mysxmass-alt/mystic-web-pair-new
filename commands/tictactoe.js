const toBold = (text) => {
    const boldChars = {
        'a': '𝗮', 'b': '𝗯', 'c': '𝗰', 'd': '𝗱', 'e': '𝗲', 'f': '𝗳', 'g': '𝗴', 'h': '𝗵', 'i': '𝗶', 'j': '𝗷', 'k': '𝗸', 'l': '𝗹', 'm': '𝗺', 'n': '𝗻', 'o': '𝗼', 'p': '𝗽', 'q': '𝗾', 'r': '𝗿', 's': '𝘀', 't': '𝘁', 'u': '𝘂', 'v': '𝘃', 'w': '𝘄', 'x': '𝗅', 'y': '𝘆', 'z': '𝘇',
        'A': '𝗔', 'B': '𝗕', 'C': '𝗖', 'D': '𝗗', 'E': '𝗘', 'F': '𝗙', 'G': '𝗚', 'H': '𝗛', 'I': '𝗜', 'J': '𝗝', 'K': '𝗞', 'L': '𝗟', 'M': '𝗠', 'N': '𝗡', 'O': '𝗢', 'P': '𝗣', 'Q': '𝗤', 'R': '𝗥', 'S': '𝗦', 'T': '𝗧', 'U': '𝗨', 'V': '𝗩', 'W': '𝗪', 'X': '𝗫', 'Y': '𝗬', 'Z': '𝗭'
    };
    return text.split('').map(c => boldChars[c] || c).join('');
};

const games = new Map();

async function tictactoeCommand(sock, from, msg, args) {
    const sender = msg.key.participant || msg.key.remoteJid;
    const senderName = msg.pushName || sender.split('@')[0];

    if (args[0] === 'stop' || args[0] === 'end') {
        if (games.has(from)) {
            games.delete(from);
            return await sock.sendMessage(from, { text: "❌ Tic-Tac-Toe game ended." }, { quoted: msg });
        }
        return await sock.sendMessage(from, { text: "No active game to stop." }, { quoted: msg });
    }

    if (games.has(from)) {
        const game = games.get(from);
        
        // If someone is joining
        if (!game.player2 && sender !== game.player1) {
            game.player2 = sender;
            game.player2Name = senderName;
            await sock.sendMessage(from, { 
                text: `🎮 ${toBold("TIC-TAC-TOE STARTED!")}\n\n` +
                      `👤 Player 1 (X): @${game.player1Name}\n` +
                      `👤 Player 2 (O): @${game.player2Name}\n\n` +
                      `It's @${game.player1Name}'s turn! Type a number (1-9) to place your mark.\n\n` +
                      renderBoard(game.board),
                mentions: [game.player1, game.player2]
            }, { quoted: msg });
            return;
        }

        // If it's a move
        const move = parseInt(args[0]);
        if (isNaN(move) || move < 1 || move > 9) {
            return; // Ignore invalid moves if a game is active
        }

        const currentPlayer = game.turn === 'X' ? game.player1 : game.player2;
        if (sender !== currentPlayer) {
            return await sock.sendMessage(from, { text: `Wait for your turn! It's ${game.turn}'s turn.` }, { quoted: msg });
        }

        if (game.board[move - 1] !== null) {
            return await sock.sendMessage(from, { text: "That spot is already taken!" }, { quoted: msg });
        }

        game.board[move - 1] = game.turn;
        const winner = checkWinner(game.board);

        if (winner) {
            const winnerName = winner === 'X' ? game.player1Name : game.player2Name;
            await sock.sendMessage(from, { 
                text: `🎉 ${toBold("GAME OVER!")}\n\n` +
                      `🏆 WINNER: @${winnerName} (${winner})\n\n` +
                      renderBoard(game.board),
                mentions: [winner === 'X' ? game.player1 : game.player2]
            }, { quoted: msg });
            games.delete(from);
        } else if (game.board.every(cell => cell !== null)) {
            await sock.sendMessage(from, { 
                text: `🤝 ${toBold("IT'S A DRAW!")}\n\n` +
                      renderBoard(game.board)
            }, { quoted: msg });
            games.delete(from);
        } else {
            game.turn = game.turn === 'X' ? 'O' : 'X';
            const nextPlayerName = game.turn === 'X' ? game.player1Name : game.player2Name;
            await sock.sendMessage(from, { 
                text: `🎮 ${toBold("TIC-TAC-TOE")}\n\n` +
                      `Next Turn: @${nextPlayerName} (${game.turn})\n\n` +
                      renderBoard(game.board),
                mentions: [game.turn === 'X' ? game.player1 : game.player2]
            }, { quoted: msg });
        }
        return;
    }

    // Start a new game
    games.set(from, {
        player1: sender,
        player1Name: senderName,
        player2: null,
        player2Name: null,
        board: Array(9).fill(null),
        turn: 'X'
    });

    await sock.sendMessage(from, { 
        text: `🎮 ${toBold("TIC-TAC-TOE CHALLENGE")}\n\n` +
              `👤 Player 1: @${senderName} (X)\n` +
              `Waiting for Player 2 to join... (Type .tictactoe to join)\n\n` +
              `Type .tictactoe stop to end the game.`,
        mentions: [sender]
    }, { quoted: msg });
}

function renderBoard(board) {
    const emojis = { 'X': '❌', 'O': '⭕', null: '⬜' };
    let text = "";
    for (let i = 0; i < 9; i++) {
        text += emojis[board[i]] || (i + 1).toString() + "️⃣";
        if ((i + 1) % 3 === 0) text += "\n";
    }
    return text;
}

function checkWinner(board) {
    const lines = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
        [0, 3, 6], [1, 4, 7], [2, 5, 8], // Cols
        [0, 4, 8], [2, 4, 6]             // Diagonals
    ];
    for (const [a, b, c] of lines) {
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            return board[a];
        }
    }
    return null;
}

module.exports = tictactoeCommand;
