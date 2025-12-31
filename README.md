# React Tic-Tac-Toe (SvelteKit Version)

This project is a Tic-Tac-Toe game originally built with React, now converted to SvelteKit. It uses TensorFlow.js for the AI opponent.

## Project Structure

```
src/
	lib/
		Board.svelte
		Square.svelte
		tf/
			predictor.js
	routes/
		+page.svelte
static/
	index.html
	10/
	100/
	1000/
	10000/
```

## Developing

This project uses `pnpm` for dependency management.

Once you've installed dependencies with `pnpm install`, start a development server:

```bash
pnpm dev
```

## Building

To create a production version of your app:

```bash
pnpm build
```

You can preview the production build with:

```bash
pnpm preview
```
