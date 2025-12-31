import * as tf from '@tensorflow/tfjs';
import * as tfn from '@tensorflow/tfjs-node';
import fs from 'fs';
import path from 'path';

// Tic-Tac-Toe Logic for Minimax
const WIN_COMBINATIONS = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Cols
    [0, 4, 8], [2, 4, 6]             // Diagonals
];

function checkWin(board) {
    for (let combo of WIN_COMBINATIONS) {
        const [a, b, c] = combo;
        if (board[a] !== 0 && board[a] === board[b] && board[a] === board[c]) {
            return board[a]; // 1 for X, -1 for O
        }
    }
    return null;
}

function isFull(board) {
    return board.every(cell => cell !== 0);
}

// Minimax to find the best outcome for the current player
// Returns: 1 if X wins, -1 if O wins, 0 for Draw
function minimax(board, depth, isMaximizing) {
    const winner = checkWin(board);
    if (winner === 1) return 10 - depth;
    if (winner === -1) return -10 + depth;
    if (isFull(board)) return 0;

    if (isMaximizing) { // X's turn
        let bestScore = -Infinity;
        for (let i = 0; i < 9; i++) {
            if (board[i] === 0) {
                board[i] = 1;
                let score = minimax(board, depth + 1, false);
                board[i] = 0;
                bestScore = Math.max(score, bestScore);
            }
        }
        return bestScore;
    } else { // O's turn
        let bestScore = Infinity;
        for (let i = 0; i < 9; i++) {
            if (board[i] === 0) {
                board[i] = -1;
                let score = minimax(board, depth + 1, true);
                board[i] = 0;
                bestScore = Math.min(score, bestScore);
            }
        }
        return bestScore;
    }
}

// Generate Dataset
// We will generate random valid board states and label them using Minimax
// Input encoding: O = 0, X = 1, Empty = 3 (matching the app's encoding)
// Internal Minimax encoding: O = -1, X = 1, Empty = 0
function generateData(numSamples) {
    const inputs = [];
    const labels = [];

    console.log(`Generating ${numSamples} samples...`);

    for (let i = 0; i < numSamples; i++) {
        // Generate a random board state
        let board = Array(9).fill(0);
        let xTurn = true; // X always starts
        let moves = Math.floor(Math.random() * 9); // Random number of moves made

        for (let j = 0; j < moves; j++) {
            const available = board.map((v, idx) => v === 0 ? idx : null).filter(v => v !== null);
            if (available.length === 0) break;
            const move = available[Math.floor(Math.random() * available.length)];
            board[move] = xTurn ? 1 : -1;
            if (checkWin(board)) break; // Stop if someone won
            xTurn = !xTurn;
        }

        // Determine the outcome from this state assuming optimal play
        // Note: The app asks for prediction of "Player O win", "Player X win", "Tie"
        // The minimax returns score for X.
        // If score > 0, X wins. If score < 0, O wins. If score == 0, Tie.
        
        // We need to know whose turn it is to call minimax correctly?
        // Actually minimax assumes it's the current player's turn to maximize/minimize.
        // But the state is static.
        // If it's X's turn (next move), we want to know if X can force a win.
        // If it's O's turn, we want to know if O can force a win.
        
        // Let's count moves to see whose turn it is.
        const xMoves = board.filter(c => c === 1).length;
        const oMoves = board.filter(c => c === -1).length;
        const isXNext = xMoves === oMoves;

        const score = minimax(board, 0, isXNext);
        
        let outcome = [0, 0, 0]; // [O win, X win, Tie]
        if (score > 0) outcome = [0, 1, 0];
        else if (score < 0) outcome = [1, 0, 0];
        else outcome = [0, 0, 1];

        // Convert board to app's input format: O=0, X=1, Empty=3
        const input = board.map(c => {
            if (c === -1) return 0;
            if (c === 1) return 1;
            return 3;
        });

        inputs.push(input);
        labels.push(outcome);
    }

    return {
        inputs: tf.tensor2d(inputs),
        labels: tf.tensor2d(labels)
    };
}

async function trainModel() {
    const model = tf.sequential();
    model.add(tf.layers.dense({
        units: 18,
        activation: 'sigmoid',
        inputShape: [9]
    }));
    model.add(tf.layers.dense({
        units: 9,
        activation: 'sigmoid'
    }));
    model.add(tf.layers.dense({
        units: 3,
        activation: 'sigmoid' // Output: [O win, X win, Tie]
    }));

    model.compile({
        optimizer: tf.train.adam(0.001),
        loss: 'meanSquaredError',
        metrics: ['accuracy']
    });

    const { inputs, labels } = generateData(5000);

    console.log('Training model...');
    await model.fit(inputs, labels, {
        epochs: 100,
        batchSize: 32,
        shuffle: true,
        validationSplit: 0.2,
        callbacks: {
            onEpochEnd: (epoch, logs) => {
                if (epoch % 10 === 0) {
                    console.log(`Epoch ${epoch}: loss = ${logs.loss.toFixed(4)}, acc = ${logs.acc.toFixed(4)}`);
                }
            }
        }
    });

    const savePath = path.resolve('static/new_model');
    await model.save(`file://${savePath}`);
    console.log(`Model saved to ${savePath}`);
}

trainModel();
