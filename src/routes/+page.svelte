<script>
	import Board from '$lib/Board.svelte';
	import { checkSquares, setModel, getBestMove } from '$lib/tf/predictor';
	import { trainModel } from '$lib/tf/trainer';

	let history = [{
		squares: Array(9).fill(null)
	}];
	let xIsNext = true; // Human (X) always starts first for simplicity
	let stepNumber = 0;
	let playerX = 0;
	let playerO = 0;
	let tie = 0;

	let isTraining = false;
	let trainingStatus = '';
	let isAiThinking = false;

	$: current = history[stepNumber];
	$: winner = calculateWinner(current.squares);
	$: status = winner 
		? 'Winner: ' + winner 
		: 'Next player: ' + (xIsNext ? 'X' : 'O');

	// Trigger AI move when it's O's turn and game is not over
	$: if (!xIsNext && !winner && !isAiThinking) {
		makeAiMove();
	}

	function calculateWinner(squares) {
		const lines = [
			[0, 1, 2],
			[3, 4, 5],
			[6, 7, 8],
			[0, 3, 6],
			[1, 4, 7],
			[2, 5, 8],
			[0, 4, 8],
			[2, 4, 6],
		];
		for (let i = 0; i < lines.length; i++) {
			const [a, b, c] = lines[i];
			if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
				return squares[a];
			}
		}
		return null;
	}

	function jumpTo(step) {
		stepNumber = step;
		xIsNext = (step % 2) ? false : true;
	}

	async function handleTrain() {
		isTraining = true;
		trainingStatus = 'Starting training...';
		try {
			const model = await trainModel((epoch, logs) => {
				trainingStatus = `Epoch ${epoch + 1}: loss = ${logs.loss.toFixed(4)}, acc = ${logs.acc.toFixed(4)}`;
			});
			setModel(model);
			trainingStatus = 'Training complete! New model loaded.';
		} catch (err) {
			console.error(err);
			trainingStatus = 'Training failed.';
		} finally {
			isTraining = false;
		}
	}

	async function makeAiMove() {
		isAiThinking = true;
		// Small delay to make it feel natural
		await new Promise(r => setTimeout(r, 500));

		const currentSquares = history[stepNumber].squares;
		const predictionInput = currentSquares.map(sq => {
			switch (sq) {
				case 'O': return 0;
				case 'X': return 1;
				default: return 3;
			}
		});

		const bestMoveIndex = await getBestMove(predictionInput);
		
		if (bestMoveIndex !== null) {
			handleClick(bestMoveIndex);
		}
		isAiThinking = false;
	}

	async function handleClick(i) {
		const historySlice = history.slice(0, stepNumber + 1);
		const current = historySlice[historySlice.length - 1];
		const squares = current.squares.slice();
		
		if (calculateWinner(squares) || squares[i]) {
			return;
		}

		squares[i] = xIsNext ? 'X' : 'O';

		const predictionInput = squares.map(sq => {
			switch (sq) {
				case 'O':
					return 0;
				case 'X':
					return 1;
				default:
					return 3;
			}
		});

		const res = await checkSquares(predictionInput);

		if (res) {
			console.log(res[0].toFixed(2), res[1].toFixed(2), res[2].toFixed(2));
			playerO = res[0].toFixed(2);
			playerX = res[1].toFixed(2);
			tie = res[2].toFixed(2);
		}

		history = historySlice.concat([{
			squares: squares
		}]);
		stepNumber = history.length - 1;
		xIsNext = !xIsNext;
	}
</script>

<div class="game">
	<div class="game-board">
		<Board squares={current.squares} onClick={handleClick} />
	</div>
	<div class="game-info">
		<div>{status}</div>
		<div>Player O win: {playerO}</div>
		<div>Player X win: {playerX}</div>
		<div>Tie: {tie}</div>
		
		<div class="training-controls">
			<button on:click={handleTrain} disabled={isTraining}>
				{isTraining ? 'Training...' : 'Train New Model'}
			</button>
			{#if trainingStatus}
				<div class="training-status">{trainingStatus}</div>
			{/if}
		</div>

		<ol>
			{#each history as step, move}
				<li>
					<button on:click={() => jumpTo(move)}>
						{move ? 'Move #' + move : 'Game start'}
					</button>
				</li>
			{/each}
		</ol>
	</div>
</div>

<style>
	:global(body) {
		font: 14px "Century Gothic", Futura, sans-serif;
		margin: 20px;
	}

	ol {
		padding-left: 30px;
	}

	.game {
		display: flex;
		flex-direction: row;
	}

	.game-info {
		margin-left: 20px;
	}

	.training-controls {
		margin: 20px 0;
		padding: 10px;
		border: 1px solid #ccc;
		border-radius: 4px;
	}

	.training-status {
		margin-top: 5px;
		font-size: 0.9em;
		color: #666;
	}
</style>
