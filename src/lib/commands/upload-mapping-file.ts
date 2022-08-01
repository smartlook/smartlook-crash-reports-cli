import * as fs from 'fs'
import got from 'got'
import FormData from 'form-data'
import archiver from 'archiver'

const HOST = 'https://api.smartlook.cloud'

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

function validateInput(args: CLIArgs) {
	if (!args.path) {
		throw new Error('Missing path')
	}
	if (!args.token) {
		throw new Error('Missing token')
	}
	if (!args.appVersion) {
		throw new Error('Missing App version')
	}
	if (!args.platform) {
		throw new Error('Missing platform')
	}
	if (!args.bundleId) {
		throw new Error('Missing bundleId')
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

	archive.glob('**/DWARF/*', {
		cwd: args.path,
	})

	await new Promise((resolve, reject) => {
		archive.on('finish', async () => {
			const requestOptions = makeOptions(args, archive)

			try {
				await upload(destinationUrl, requestOptions)
				resolve(true)
			} catch (e) {
				console.log(e)
				reject()
			}
		})

		archive.on('error', (err) => reject)

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

		console.log('Uplading successfull: ', body)
	} catch (e) {
		throw new Error('Uploading failed')
	}
}

export async function uploadMappingFile(args: CLIArgs): Promise<void> {
	try {
		validateInput(args)
	} catch (e) {
		console.log(e)
		return
	}

	const publicApiUrl = `${HOST}/api/v1/bundles/${args.bundleId}/platforms/${args.platform}/releases/${args.appVersion}/mapping-files`

	if (args.platform === 'android') {
		await uploadAndroid(publicApiUrl, args)
	} else {
		await uploadIos(publicApiUrl, args)
	}
}
