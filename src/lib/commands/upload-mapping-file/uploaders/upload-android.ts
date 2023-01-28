import * as fs from 'fs'
import FormData from 'form-data'

import { CLIArgs, RequestOptions } from '../types'

export async function uploadAndroid(args: CLIArgs): Promise<RequestOptions> {
	const searchParams = { force: args.force == true ? 'true' : 'false' }
	const form: any = new FormData()

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
