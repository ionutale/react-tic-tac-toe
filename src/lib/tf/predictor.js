// Import @tensorflow/tfjs-core
import * as tf from '@tensorflow/tfjs-core';
// Adds the CPU backend to the global backend registry.
import '@tensorflow/tfjs-backend-cpu';
import * as tfl from '@tensorflow/tfjs-layers'

const modelUrl = `/100/model.json`;
let model = null;

export function setModel(newModel) {
  model = newModel;
}

export async function checkSquares(squares = [3, 3, 3, 3, 3, 3, 3, 3, 3]) {
  try {
    if (!model) {
      model = await tfl.loadLayersModel(modelUrl);
    }
    console.log(squares)

    const result = model.predict(tf.tensor2d([squares]));
    result.print()

    const res = result.dataSync()
    return Array.from(res)
  } catch (error) {
    console.error(error);
    return null
  }
}

export async function getBestMove(squares) {
  try {
    if (!model) {
      model = await tfl.loadLayersModel(modelUrl);
    }

    const emptyIndices = squares
      .map((val, idx) => val === 3 ? idx : null)
      .filter(val => val !== null);

    if (emptyIndices.length === 0) return null;

    const potentialBoards = emptyIndices.map(idx => {
      const newBoard = [...squares];
      newBoard[idx] = 0; // Place 'O' (which is 0 in input format)
      return newBoard;
    });

    const predictions = model.predict(tf.tensor2d(potentialBoards));
    const results = await predictions.data();

    // results is [O_win, X_win, Tie, O_win, X_win, Tie, ...]
    // We want to maximize O_win (index 0, 3, 6...)

    let bestMoveIndex = -1;
    let bestScore = -Infinity;

    for (let i = 0; i < emptyIndices.length; i++) {
      const oWinProb = results[i * 3];
      if (oWinProb > bestScore) {
        bestScore = oWinProb;
        bestMoveIndex = emptyIndices[i];
      }
    }

    predictions.dispose();
    return bestMoveIndex;
  } catch (error) {
    console.error(error);
    return null;
  }
}
