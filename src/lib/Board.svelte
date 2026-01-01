<script>
	import Square from './Square.svelte';
	export let squares;
	export let onClick;
</script>

<div class="board">
	{#each squares as square, i}
		<Square value={square} onClick={() => onClick(i)} />
	{/each}
</div>

<style>
	.board {
		display: grid;
		grid-template-columns: repeat(3, 100px);
		grid-template-rows: repeat(3, 100px);
		gap: 15px;
		padding: 20px;
		background: rgba(255, 255, 255, 0.05);
		border-radius: 20px;
		border: 1px solid rgba(255, 255, 255, 0.1);
		backdrop-filter: blur(5px);
	}
</style>
