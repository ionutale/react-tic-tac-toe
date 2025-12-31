// Import @tensorflow/tfjs-core
import * as tf from '@tensorflow/tfjs-core';
// Adds the CPU backend to the global backend registry.
import '@tensorflow/tfjs-backend-cpu';
import * as tfl from '@tensorflow/tfjs-layers'

const modelUrl = `/100/model.json`;
let model = null;

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
