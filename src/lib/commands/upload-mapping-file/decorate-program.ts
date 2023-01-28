import { Command } from 'commander'
import { uploadMappingFile } from './upload-mapping-file'
import { ValidationError } from '../../ValidationError'
import { error } from '../../logger'

export function decorateProgram(cmder: Command): Command {
	return cmder
		.command('upload-mapping-file')
		.alias('umf')
		.option(
			'-a --apiHost <value>',
			'URL of REST API for uploading mapping files',
			process.env.API_HOST ?? 'https://api.smartlook.cloud'
		)
		.option(
			'-p --path <value>',
			'Path to mapping file to be uploaded - for iOS either path to.xcarchive or single dSYM file, for Android path to the Proguard file. Can be set as ENV variable PATH_TO_MAPING_FILE',
			process.env.PATH_TO_MAPING_FILE
		)
		.option(
			'-t --token <value>',
			'API token to access Smartlook Public API. Can be set as ENV variable API_TOKEN',
			process.env.API_TOKEN
		)
		.option(
			'-b --bundleId <value>',
			'BundleId of Application related to uploaded mapping file. Can be set as ENV variable BUNDLE_ID',
			process.env.BUNDLE_ID
		)
		.option(
			'-av --appVersion <value>',
			'Version of Application related to uploaded mapping file. Can be set as ENV variable APP_VERSION',
			process.env.APP_VERSION
		)
		.option(
			'-pl --platform <value>',
			'Platform of Application related to uploaded mapping file. Supported values are `android` and `ios`. Can be set as ENV variable PLATFORM',
			process.env.PLATFORM
		)
		.option(
			'-iv --internalVersion <value>',
			'Internal version of the application related to uploaded mapping file. Can be set as ENV variable INTERNAL_APP_VERSION',
			process.env.INTERNAL_APP_VERSION
		)
		.option(
			'-f --force',
			'Argument to force the mapping file upload',
			process.env.FORCE
		)
		.action(async (args) => {
			try {
				await uploadMappingFile(args)
			} catch (err: any) {
				if (err instanceof ValidationError) {
					cmder.error(err.toString())
				} else {
					error(err.message)
				}
			}
		})
}
