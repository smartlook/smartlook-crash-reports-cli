import archiver from 'archiver'
import * as fs from 'fs'
import * as plist from 'plist'
import * as path from 'node:path'
import * as os from 'node:os'
import { execSync } from 'node:child_process'
import glob from 'glob'
import {
	AppIdentifiers,
	CLIArgs,
	IDSymInfo,
	InfoPlistFile,
	RequestOptions,
} from './types'
import { uploadAndroid, uploadApple } from './uploaders'

import { debug, error, info } from '../../logger'
import { isXcarchive } from './helpers'
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
	if (args.platform === 'apple' && isXcarchive(args.path)) {
		const appIdentifiers = parseIdentifiersFromPlist(args.path)

		info('Info.plist found - %j', appIdentifiers)

		args = mergeArgs(args, appIdentifiers)
	}

	validateInput(args)
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

function parseIdentifiersFromPlist(basePath: string): AppIdentifiers | null {
	const infoPlistFile = fs.readFileSync(
		path.resolve(process.cwd(), `${basePath}/Info.plist`)
	)

	const parsed = plist.parse(infoPlistFile.toString()) as InfoPlistFile

	return {
		appVersion: parsed?.ApplicationProperties?.CFBundleShortVersionString,
		internalAppVersion: parsed?.ApplicationProperties?.CFBundleVersion,
		bundleId: parsed?.ApplicationProperties?.CFBundleIdentifier,
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

	validateAndAugmentArguments(args)

	const publicApiUrl = buildApiURL(
		args.apiHost,
		args.bundleId,
		args.platform,
		args.appVersion
	)

	let uploadOptions: RequestOptions | null = await uploadStrategies[
		args.platform
	](args)

	if (uploadOptions) {
		await upload(publicApiUrl, uploadOptions)
	} else {
		error('nothing uploaded')
	}
}
