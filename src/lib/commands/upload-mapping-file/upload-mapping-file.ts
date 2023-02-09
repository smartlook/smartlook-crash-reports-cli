import * as fs from 'fs'
import * as plist from 'plist'
import * as path from 'node:path'
import glob from 'glob'
import {
	AppIdentifiers,
	CLIArgs,
	IXCarchiveInfoPlistFile,
	IApplicationProperties,
	RequestOptions,
} from './types'
import { uploadAndroid, uploadApple } from './uploaders'

import { debug, error, info } from '../../logger'
import { upload } from './upload'
import { ValidationError } from '../../ValidationError'

function validateInput(args: CLIArgs) {
	if (!args.platform) {
		throw new ValidationError('Missing argument "platform"')
	}
	if (!args.path) {
		throw new ValidationError('Missing argument "path"')
	}
	if (!args.token) {
		throw new ValidationError('Missing argument "token"')
	}
	if (!args.appVersion) {
		throw new ValidationError('Missing argument "appVersion"')
	}
	if (!args.bundleId) {
		throw new ValidationError('Missing argument "bundleId"')
	}
}

function validateAndAugmentArguments(args: CLIArgs) {
	if (args.platform === 'apple') {
		const plistFiles = glob.sync('**/Info.plist', {
			cwd: args.path,
		})

		if (plistFiles.length > 0) {
			plistFiles.sort((a, b) => a.length - b.length)
			debug('following Info.plist files found: %j', plistFiles)

			const plistPath = path.join(args.path, plistFiles[0])

			debug('using following Info.plist file: %s', plistPath)

			try {
				const appIdentifiers = parseIdentifiersFromPlist(plistPath)

				info('Info.plist found - %j', appIdentifiers)

				args = mergeArgs(args, appIdentifiers)

				debug('merged properties: %j', args)
			} catch (err: any) {
				error('cannot parse Info.plist - %s', err.message)
			}
		}
	}

	validateInput(args)

	return args
}

function mergeArgs(args: CLIArgs, identifiers: AppIdentifiers | null): CLIArgs {
	return {
		...args,
		appVersion: args.appVersion ?? identifiers?.appVersion,
		internalAppVersion:
			args.internalAppVersion ?? identifiers?.internalAppVersion,
		bundleId: args.bundleId ?? identifiers?.bundleId,
	}
}

function isXCarchiveFile(
	properties: unknown
): properties is IXCarchiveInfoPlistFile {
	return !!(properties as IXCarchiveInfoPlistFile).ApplicationProperties
}

function parseIdentifiersFromPlist(plistPath: string): AppIdentifiers | null {
	const infoPlistFile = fs.readFileSync(path.resolve(process.cwd(), plistPath))

	const parsed = plist.parse(infoPlistFile.toString()) as
		| IXCarchiveInfoPlistFile
		| IApplicationProperties

	const applicationProperties: IApplicationProperties | undefined =
		isXCarchiveFile(parsed) ? parsed.ApplicationProperties : parsed

	const APP_VERSION_KEY = 'CFBundleShortVersionString'
	const INTERNAL_APP_VERSION_KEY = 'CFBundleVersion'
	const BUNDLE_ID_KEY = 'CFBundleIdentifier'

	return {
		appVersion: applicationProperties?.[APP_VERSION_KEY],
		internalAppVersion: applicationProperties?.[INTERNAL_APP_VERSION_KEY],
		bundleId: applicationProperties?.[BUNDLE_ID_KEY],
	}
}

function buildApiURL(
	apiHost: string,
	bundleId: string,
	platform: 'apple' | 'android',
	appVersion: string
) {
	return `${apiHost}/api/v1/bundles/${bundleId}/platforms/${platform}/releases/${appVersion}/mapping-files`
}

const uploadStrategies = {
	android: uploadAndroid,
	apple: uploadApple,
}

export async function uploadMappingFile(args: CLIArgs): Promise<void> {
	info('preparing upload of the mapping files')

	args = validateAndAugmentArguments(args)

	let uploadOptions: RequestOptions | null = await uploadStrategies[
		args.platform
	](args)

	const publicApiUrl = buildApiURL(
		args.apiHost,
		args.bundleId,
		args.platform,
		args.appVersion
	)

	if (uploadOptions) {
		await upload(publicApiUrl, uploadOptions)
	} else {
		error('nothing uploaded')
	}
}
