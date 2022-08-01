import { uploadMappingFile } from '../lib/commands/upload-mapping-file'
import nock from 'nock'

describe('uploadMappingFile', () => {
	const token = 'api-token'
	const path = `${__dirname}/test-mapping-file.txt`
	const bundleId = 'prod'
	const appVersion = '0.0.1'
	const internalAppVersion = 'beta.1234'
	const force = true

	describe('uploadTo', () => {
		it('should send mapping file to public-api', async () => {
			const uploadingNock = nock('https://api.smartlook.cloud', {
				encodedQueryParams: true,
			})
				.post(
					'/api/v1/bundles/prod/platforms/android/releases/0.0.1/mapping-files',
					(body) => {
						expect(
							body.toString().includes('content of test mapping file')
						).toEqual(true)
						return true
					}
				)
				.query({ force: 'true' })
				.reply(201, {
					oid: 'oid',
					createdAt: new Date('2021-09-10'),
					state: 'completed',
				})

			await uploadMappingFile({
				token,
				path,
				bundleId,
				appVersion,
				platform: 'android',
				internalAppVersion,
				force,
			})

			expect(uploadingNock.isDone()).toBeTruthy()
		})
	})
})

