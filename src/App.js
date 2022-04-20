import React, { Component } from 'react';
import './TicTacToe.css';
import Game from './Game.js';

class App extends Component {
  render() {
    return (
      <div className="App">
        <p className="App-intro">
          <Game></Game>
        </p>
      </div>
    );
  }
}

export default App;
