import axios from 'axios'

import { debug, error, info } from '../../logger'
import { RequestOptions } from './types'

export async function upload(
	destinationUrl: string,
	requestOptions: RequestOptions
): Promise<void> {
	info('uploading files')
	const uploadURL =
		destinationUrl + '?' + new URLSearchParams(requestOptions.searchParams)

	debug('upload url: %s', uploadURL)

	try {
		const response = await axios.post(uploadURL, requestOptions.body, {
			headers: requestOptions.headers,
		})

		info('mapping files were uploaded')
	} catch (err: any) {
		error('upload failed: %s', err.message, err.code)
		debug('upload error response: %s %j', err.message, err.response.data)
	}
}
