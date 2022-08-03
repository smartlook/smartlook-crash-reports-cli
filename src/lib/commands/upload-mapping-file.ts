import archiver from 'archiver'
import * as fs from 'fs'
import FormData from 'form-data'
import got from 'got'
import * as plist from 'plist'

const HOST = 'https://api.smartlook.cloud'

interface AppIdentifiers {
	appVersion?: string
	bundleId?: string
	internalAppVersion?: string
}

interface CLIArgs {
	path: string
	token: string
	appVersion: string
	platform: 'android' | 'ios'
	bundleId: string
	internalAppVersion?: string
	force?: boolean
}

interface RequestOptions {
	searchParams: Record<string, string>
	body: FormData
	headers: Record<string, string>
}

interface InfoPlistFile {
	ApplicationProperties?: {
		CFBundleIdentifier?: string
		CFBundleShortVersionString?: string
		CFBundleVersion?: string
	}
}

const isXcarchive = (path: string) => !path.endsWith('.dSYM')

function validateInput(args: CLIArgs, isXcarchive: boolean) {
	if (!args.path) {
		throw new Error('Missing path')
	}
	if (!args.token) {
		throw new Error('Missing token')
	}
	if (!args.appVersion && !isXcarchive) {
		throw new Error('Missing App version')
	}
	if (!args.platform) {
		throw new Error('Missing platform')
	}
	if (!args.bundleId && !isXcarchive) {
		throw new Error('Missing bundleId')
	}
}

async function parseIdentifiersFromPlist(
	path: string
): Promise<AppIdentifiers | null> {
	try {
		const infoPlistFile = await fs.promises.readFile(`${path}/Info.plist`)

		const parsed = plist.parse(infoPlistFile.toString()) as InfoPlistFile
		return {
			appVersion: parsed?.ApplicationProperties?.CFBundleShortVersionString,
			internalAppVersion: parsed?.ApplicationProperties?.CFBundleVersion,
			bundleId: parsed?.ApplicationProperties?.CFBundleIdentifier,
		}
	} catch (e) {
		console.log(e)
		return null
	}
}

function makeOptions(
	args: CLIArgs,
	zipFile?: archiver.Archiver
): RequestOptions {
	const searchParams = { force: args.force == true ? 'true' : 'false' }
	const form = new FormData()

	const readMappingFile = zipFile || fs.createReadStream(args.path)

	form.append(
		'mappingFile',
		readMappingFile,
		zipFile ? { knownLength: zipFile.pointer() } : undefined
	)

	if (args.internalAppVersion) {
		form.append('internalAppVersion', args.internalAppVersion)
	}

	const headers = {
		Authorization: `Bearer ${args.token}`,
		...form.getHeaders(),
	}

	return {
		searchParams,
		headers,
		body: form,
	}
}

async function uploadAndroid(
	destinationUrl: string,
	args: CLIArgs
): Promise<void> {
	const requestOptions = makeOptions(args)
	await upload(destinationUrl, requestOptions)
}

async function uploadIos(destinationUrl: string, args: CLIArgs): Promise<void> {
	const archive = archiver('zip', {
		zlib: { level: 6 },
	})

	if (!isXcarchive(args.path)) {
		// We want the dSYM name as root folder
		const dsymName = args.path.split('/').pop()
		archive.directory(args.path, dsymName || false)
	} else {
		archive.glob('**/*.dSYM/**', {
			cwd: args.path,
		})
	}

	await new Promise((resolve, reject) => {
		archive.on('finish', async () => {
			const requestOptions = makeOptions(args, archive)

			try {
				await upload(destinationUrl, requestOptions)
				resolve(true)
			} catch (e) {
				reject(e)
			}
		})

		archive.on('error', (e: Error) => reject(e))

		archive.finalize()
	})
}

async function upload(
	destinationUrl: string,
	requestOptions: RequestOptions
): Promise<void> {
	console.log('Started uploading mapping file')
	try {
		const { body, statusCode } = await got.post(destinationUrl, requestOptions)

		if (statusCode !== 201) {
			throw new Error(
				`Uploading mapping file failed with status code ${statusCode}`
			)
		}

		console.log('Uploading successfull: ', body)
	} catch (e) {
		throw new Error('Uploading failed')
	}
}

export async function uploadMappingFile(args: CLIArgs): Promise<void> {
	try {
		validateInput(args, isXcarchive(args.path))
	} catch (e) {
		console.log(e)
		return
	}

	if (args.platform === 'ios') {
	}

	const publicApiUrl = `${HOST}/api/v1/bundles/${args.bundleId}/platforms/${args.platform}/releases/${args.appVersion}/mapping-files`

	switch (args.platform) {
		case 'android':
			await uploadAndroid(publicApiUrl, args)
			break
		case 'ios':
			await uploadIos(publicApiUrl, args)
			break
		default:
			throw new Error('Unknown platform')
	}
}
