import * as commander from 'commander'
import { commandDecorators } from './lib/commands'
import { debug, error } from './lib/logger'

const pjson = require('../package.json')

async function run() {
	const cmder = new commander.Command()

	debug('version: %s', pjson.version)

	cmder
		.version(pjson.version)
		.name('smartlook-crash-reports')
		.usage('[command] [options]')
	cmder.alias('slcr')

	for (const decorator of commandDecorators) {
		decorator(cmder)
	}

	cmder.showHelpAfterError()

	await cmder.parseAsync(process.argv)
}

if (require.main) {
	run()
}
