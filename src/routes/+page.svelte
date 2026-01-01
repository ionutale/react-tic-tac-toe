<script>
	import Board from '$lib/Board.svelte';
	import { checkSquares, setModel, getBestMove } from '$lib/tf/predictor';
	import { trainModel } from '$lib/tf/trainer';
	import { onMount } from 'svelte';

	let history = [{
		squares: Array(9).fill(null)
	}];
	let xIsNext = true;
	let stepNumber = 0;
	let playerX = 0;
	let playerO = 0;
	let tie = 0;

	let isTraining = false;
	let trainingStatus = '';
	let isAiThinking = false;
	let gameMode = 'pvp'; // 'pvp' or 'pva' (Player vs AI)

	$: current = history[stepNumber];
	$: winner = calculateWinner(current.squares);
	$: isDraw = !winner && current.squares.every(s => s !== null);
	$: status = winner 
		? `Winner: ${winner}` 
		: isDraw 
			? "It's a Draw!" 
			: `Next Player: ${xIsNext ? 'X' : 'O'}`;

	// Trigger AI move when it's O's turn and game is not over in PvAI mode
	$: if (gameMode === 'pva' && !xIsNext && !winner && !isAiThinking && !isDraw) {
		makeAiMove();
	}

	function calculateWinner(squares) {
		const lines = [
			[0, 1, 2], [3, 4, 5], [6, 7, 8],
			[0, 3, 6], [1, 4, 7], [2, 5, 8],
			[0, 4, 8], [2, 4, 6],
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
		xIsNext = (step % 2) === 0;
	}

	function resetGame() {
		history = [{ squares: Array(9).fill(null) }];
		stepNumber = 0;
		xIsNext = true;
	}

	async function handleTrain() {
		isTraining = true;
		trainingStatus = 'Initializing...';
		try {
			const model = await trainModel((epoch, logs) => {
				trainingStatus = `Training: Epoch ${epoch + 1}/50 | Loss: ${logs.loss.toFixed(4)}`;
			});
			setModel(model);
			trainingStatus = 'Successfully trained and loaded custom model!';
		} catch (err) {
			console.error(err);
			trainingStatus = 'Training failed. Check console.';
		} finally {
			isTraining = false;
		}
	}

	async function makeAiMove() {
		isAiThinking = true;
		await new Promise(r => setTimeout(r, 600));

		const currentSquares = history[stepNumber].squares;
		const predictionInput = currentSquares.map(sq => {
			if (sq === 'O') return 0;
			if (sq === 'X') return 1;
			return 3;
		});

		const bestMoveIndex = await getBestMove(predictionInput);
		
		if (bestMoveIndex !== null && bestMoveIndex !== -1) {
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
			if (sq === 'O') return 0;
			if (sq === 'X') return 1;
			return 3;
		});

		const res = await checkSquares(predictionInput);

		if (res) {
			playerO = (res[0] * 100).toFixed(1);
			playerX = (res[1] * 100).toFixed(1);
			tie = (res[2] * 100).toFixed(1);
		}

		history = [...historySlice, { squares }];
		stepNumber = history.length - 1;
		xIsNext = !xIsNext;
	}
</script>

<main class="container">
	<header>
		<h1>Neural Tic-Tac-Toe</h1>
		<p class="subtitle">Powered by TensorFlow.js</p>
	</header>

	<div class="game-layout">
		<section class="game-view">
			<div class="status-badge {winner ? 'winner' : ''} {isDraw ? 'draw' : ''}">
				{status}
				{#if isAiThinking}
					<span class="dot-typing"></span>
				{/if}
			</div>

			<Board squares={current.squares} onClick={handleClick} />

			<div class="controls">
				<button class="btn secondary" on:click={resetGame}>New Game</button>
				<div class="mode-toggle">
					<button 
						class="btn-toggle {gameMode === 'pvp' ? 'active' : ''}" 
						on:click={() => { gameMode = 'pvp'; resetGame(); }}
					>
						Local PvP
					</button>
					<button 
						class="btn-toggle {gameMode === 'pva' ? 'active' : ''}" 
						on:click={() => { gameMode = 'pva'; resetGame(); }}
					>
						Vs AI
					</button>
				</div>
			</div>
		</section>

		<aside class="side-panel">
			<div class="card stats-card">
				<h3>Win Probabilities</h3>
				<div class="prob-grid">
					<div class="prob-item x">
						<span class="label">X Win</span>
						<div class="bar-container"><div class="bar" style="width: {playerX}%"></div></div>
						<span class="value">{playerX}%</span>
					</div>
					<div class="prob-item o">
						<span class="label">O Win</span>
						<div class="bar-container"><div class="bar" style="width: {playerO}%"></div></div>
						<span class="value">{playerO}%</span>
					</div>
					<div class="prob-item tie">
						<span class="label">Tie</span>
						<div class="bar-container"><div class="bar" style="width: {tie}%"></div></div>
						<span class="value">{tie}%</span>
					</div>
				</div>
			</div>

			<div class="card training-card">
				<h3>Neural Network</h3>
				<button class="btn primary full" on:click={handleTrain} disabled={isTraining}>
					{isTraining ? 'Training...' : 'Retrain Model'}
				</button>
				{#if trainingStatus}
					<p class="training-status">{trainingStatus}</p>
				{/if}
			</div>

			<div class="card history-card">
				<h3>Match History</h3>
				<div class="history-list">
					{#each history as step, move}
						<button 
							class="history-btn {stepNumber === move ? 'active' : ''}" 
							on:click={() => jumpTo(move)}
						>
							{move ? `Move #${move}` : 'Match Start'}
						</button>
					{/each}
				</div>
			</div>
		</aside>
	</div>
</main>

<style>
	:global(body) {
		margin: 0;
		font-family: 'Inter', system-ui, -apple-system, sans-serif;
		background: #0f172a;
		color: #f8fafc;
		min-height: 100vh;
	}

	.container {
		max-width: 1100px;
		margin: 0 auto;
		padding: 2rem;
	}

	header {
		text-align: center;
		margin-bottom: 3rem;
	}

	h1 {
		font-size: 3rem;
		font-weight: 800;
		margin: 0;
		background: linear-gradient(135deg, #60a5fa 0%, #c084fc 100%);
		-webkit-background-clip: text;
		background-clip: text;
		-webkit-text-fill-color: transparent;
	}

	.subtitle {
		color: #94a3b8;
		font-size: 1.1rem;
		margin-top: 0.5rem;
	}

	.game-layout {
		display: grid;
		grid-template-columns: 1fr 350px;
		gap: 3rem;
		align-items: start;
	}

	@media (max-width: 900px) {
		.game-layout {
			grid-template-columns: 1fr;
		}
	}

	.game-view {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 2rem;
	}

	.status-badge {
		padding: 0.75rem 2rem;
		background: rgba(255, 255, 255, 0.05);
		border-radius: 50px;
		font-weight: 600;
		font-size: 1.25rem;
		border: 1px solid rgba(255, 255, 255, 0.1);
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
		min-width: 200px;
		text-align: center;
	}

	.status-badge.winner {
		background: rgba(34, 197, 94, 0.1);
		border-color: rgba(34, 197, 94, 0.2);
		color: #4ade80;
	}

	.status-badge.draw {
		background: rgba(234, 179, 8, 0.1);
		border-color: rgba(234, 179, 8, 0.2);
		color: #facc15;
	}

	.controls {
		display: flex;
		gap: 1rem;
		width: 100%;
		justify-content: center;
	}

	.mode-toggle {
		display: flex;
		background: rgba(255, 255, 255, 0.05);
		padding: 4px;
		border-radius: 12px;
		border: 1px solid rgba(255, 255, 255, 0.1);
	}

	.btn-toggle {
		background: transparent;
		border: none;
		color: #94a3b8;
		padding: 0.5rem 1.25rem;
		border-radius: 8px;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
	}

	.btn-toggle.active {
		background: #3b82f6;
		color: white;
		box-shadow: 0 4px 10px rgba(59, 130, 246, 0.3);
	}

	.btn {
		padding: 0.75rem 1.5rem;
		border-radius: 12px;
		font-weight: 600;
		cursor: pointer;
		border: none;
		transition: all 0.2s;
	}

	.btn.primary { background: #3b82f6; color: white; }
	.btn.primary:hover { background: #2563eb; transform: translateY(-1px); }
	.btn.primary:disabled { background: #1e293b; color: #64748b; cursor: not-allowed; }

	.btn.secondary { background: rgba(255, 255, 255, 0.05); color: white; border: 1px solid rgba(255, 255, 255, 0.1); }
	.btn.secondary:hover { background: rgba(255, 255, 255, 0.1); }

	.full { width: 100%; }

	.side-panel {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.card {
		background: rgba(255, 255, 255, 0.03);
		border: 1px solid rgba(255, 255, 255, 0.05);
		border-radius: 20px;
		padding: 1.5rem;
		backdrop-filter: blur(10px);
	}

	.card h3 {
		margin: 0 0 1.5rem 0;
		font-size: 1.1rem;
		color: #94a3b8;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.prob-grid {
		display: flex;
		flex-direction: column;
		gap: 1.25rem;
	}

	.prob-item {
		display: grid;
		grid-template-columns: 60px 1fr 50px;
		align-items: center;
		gap: 1rem;
	}

	.label { font-size: 0.875rem; color: #94a3b8; }
	.value { font-size: 0.875rem; font-weight: 600; text-align: right; }

	.bar-container {
		height: 8px;
		background: rgba(255, 255, 255, 0.05);
		border-radius: 10px;
		overflow: hidden;
	}

	.bar { height: 100%; border-radius: 10px; transition: width 0.5s ease-out; }
	.prob-item.x .bar { background: #ef4444; }
	.prob-item.o .bar { background: #3b82f6; }
	.prob-item.tie .bar { background: #eab308; }

	.training-status {
		margin-top: 1rem;
		font-size: 0.875rem;
		color: #94a3b8;
		line-height: 1.5;
	}

	.history-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		max-height: 300px;
		overflow-y: auto;
		padding-right: 0.5rem;
	}

	.history-btn {
		text-align: left;
		padding: 0.75rem 1rem;
		background: transparent;
		border: 1px solid transparent;
		border-radius: 10px;
		color: #94a3b8;
		cursor: pointer;
		transition: all 0.2s;
	}

	.history-btn:hover { background: rgba(255, 255, 255, 0.05); color: white; }
	.history-btn.active { 
		background: rgba(59, 130, 246, 0.1); 
		color: #3b82f6; 
		border-color: rgba(59, 130, 246, 0.2); 
	}

	.dot-typing {
		display: inline-block;
		width: 4px;
		height: 4px;
		border-radius: 5px;
		background-color: #94a3b8;
		color: #94a3b8;
		animation: dot-typing 1.5s infinite linear;
		margin-left: 10px;
		vertical-align: middle;
	}

	@keyframes dot-typing {
		0% { box-shadow: 9984px 0 0 0 #94a3b8, 9992px 0 0 0 #94a3b8, 10000px 0 0 0 #94a3b8; }
		16.667% { box-shadow: 9984px -10px 0 0 #94a3b8, 9992px 0 0 0 #94a3b8, 10000px 0 0 0 #94a3b8; }
		33.333% { box-shadow: 9984px 0 0 0 #94a3b8, 9992px 0 0 0 #94a3b8, 10000px 0 0 0 #94a3b8; }
		50% { box-shadow: 9984px 0 0 0 #94a3b8, 9992px -10px 0 0 #94a3b8, 10000px 0 0 0 #94a3b8; }
		66.667% { box-shadow: 9984px 0 0 0 #94a3b8, 9992px 0 0 0 #94a3b8, 10000px 0 0 0 #94a3b8; }
		83.333% { box-shadow: 9984px 0 0 0 #94a3b8, 9992px 0 0 0 #94a3b8, 10000px -10px 0 0 #94a3b8; }
		100% { box-shadow: 9984px 0 0 0 #94a3b8, 9992px 0 0 0 #94a3b8, 10000px 0 0 0 #94a3b8; }
	}
</style>
