import * as fs from 'fs'
import got from 'got'
import FormData from 'form-data'

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

function makeOptions(args: CLIArgs) {
	const searchParams = { force: args.force == true ? 'true' : 'false' }

	const form = new FormData()
	const readMappingFile = fs.createReadStream(args.path)
	form.append('mappingFile', readMappingFile)

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

async function uploadTo(destinationUrl: string, args: CLIArgs): Promise<void> {
	const requestOptions = makeOptions(args)

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
		console.error(e)
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

	await uploadTo(publicApiUrl, args)
}

