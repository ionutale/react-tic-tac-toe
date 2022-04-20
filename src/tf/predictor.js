// Import @tensorflow/tfjs-core
import * as tf from '@tensorflow/tfjs-core';
// Adds the CPU backend to the global backend registry.
import '@tensorflow/tfjs-backend-cpu';
import * as tfl from '@tensorflow/tfjs-layers'

const modelUrl = `https://3000-ionutale-reacttictactoe-afaqmr9n8ke.ws-eu34.gitpod.io/100/model.json`;
let model = null

export async function checkSqares(sqares = [3, 3, 3, 3, 3, 3, 3, 3, 3]) {
  try {
    if (!model) {
      model = await tfl.loadLayersModel(modelUrl);
    }
    console.log(sqares)
    // Set the backend to WASM and wait for the module to be ready.
    // await tf.setBackend('wasm')
 
    // model.summary()

    const result = model.predict(tf.tensor2d([sqares])) //.print();
    result.print()
    
    const res = result.dataSync()
    return Array.from(res)
  } catch (error) {
    console.error(error);
    return null
  }
}


