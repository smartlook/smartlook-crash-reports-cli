import { uploadMappingFile } from '../lib/commands/upload-mapping-file'
import nock from 'nock'

const hexToString = (hex: any) => {
	let str = ''
	for (let i = 0; i < hex.length; i += 2)
		str += String.fromCharCode(parseInt(hex.substr(i, 2), 16))
	return str
}

describe('uploadMappingFile', () => {
	const token = 'api-token'
	const path = `${__dirname}/test-mapping-file.txt`
	const dsymArchivePath = `${__dirname}/test.xcarchive`
	const dsymPath = `${__dirname}/test.xcarchive/dSYMs/SmartlookAnalytics.framework.dSYM/Contents/Resources/DWARF/SmartlookAnalytics`
	const bundleId = 'prod'
	const appVersion = '0.0.1'
	const internalAppVersion = 'beta.1234'
	const force = true

	describe('upload', () => {
		it('should send android mapping file to public-api', async () => {
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

		it('should send ios dsyms from .xcarchive to public-api', async () => {
			const uploadingNock = nock('https://api.smartlook.cloud', {
				encodedQueryParams: true,
			})
				.post(
					'/api/v1/bundles/prod/platforms/ios/releases/0.0.1/mapping-files',
					(body) => {
						expect(
							// Multipart with files will be hex encoded by default, need to decode it
							hexToString(body).includes(
								'Content-Disposition: form-data; name="mappingFile"'
							)
						).toBeTruthy()
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
				path: dsymArchivePath,
				bundleId,
				appVersion,
				platform: 'ios',
				internalAppVersion,
				force,
			})

			expect(uploadingNock.isDone()).toBeTruthy()
		})

		it('should send single ios dsym to public-api', async () => {
			const uploadingNock = nock('https://api.smartlook.cloud', {
				encodedQueryParams: true,
			})
				.post(
					'/api/v1/bundles/prod/platforms/ios/releases/0.0.1/mapping-files',
					(body) => {
						expect(body.includes('smartlook test')).toBeTruthy()
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
				path: dsymPath,
				bundleId,
				appVersion,
				platform: 'ios',
				internalAppVersion,
				force,
			})

			expect(uploadingNock.isDone()).toBeTruthy()
		})
	})
})
