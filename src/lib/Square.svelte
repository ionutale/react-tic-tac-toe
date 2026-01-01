<script>
	export let value;
	export let onClick;
</script>

<button 
	class="square {value}" 
	on:click={onClick}
	aria-label={value ? `Square filled with ${value}` : 'Empty square'}
>
	<span class="value">{value || ''}</span>
</button>

<style>
	.square {
		background: rgba(255, 255, 255, 0.1);
		backdrop-filter: blur(10px);
		border: 1px solid rgba(255, 255, 255, 0.2);
		border-radius: 12px;
		font-size: 3rem;
		font-weight: 800;
		height: 100px;
		width: 100px;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		color: #fff;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
	}

	.square:hover {
		background: rgba(255, 255, 255, 0.15);
		transform: translateY(-2px);
		box-shadow: 0 8px 15px rgba(0, 0, 0, 0.2);
		border-color: rgba(255, 255, 255, 0.4);
	}

	.square:active {
		transform: translateY(0);
	}

	.square.X {
		color: #ff4757;
		text-shadow: 0 0 15px rgba(255, 71, 87, 0.5);
	}

	.square.O {
		color: #2e86de;
		text-shadow: 0 0 15px rgba(46, 134, 222, 0.5);
	}

	.square:focus {
		outline: 2px solid rgba(255, 255, 255, 0.5);
		outline-offset: 4px;
	}

	.value {
		animation: scaleIn 0.2s ease-out;
	}

	@keyframes scaleIn {
		from { transform: scale(0.5); opacity: 0; }
		to { transform: scale(1); opacity: 1; }
	}
</style>
