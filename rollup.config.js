const commonjs = require('@rollup/plugin-commonjs')
const json = require('@rollup/plugin-json')

export default {
	input: './build/index.js',
	output: {
		dir: 'dist',
		format: 'cjs',
	},
	plugins: [commonjs(), json()],
}
