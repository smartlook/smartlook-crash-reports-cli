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
	const dsymPath = `${__dirname}/test.xcarchive/dSYMs/SmartlookAnalytics.framework.dSYM`
	const bundleId = 'prod'
	const appVersion = '0.0.1'
	const internalAppVersion = 'beta.1234'
	const force = true
	const apiHost = 'https://api.smartlook.cloud'

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
				apiHost,
				platform: 'android',
				internalAppVersion,
				force,
			})

			expect(uploadingNock.isDone()).toBeTruthy()
		})

		it('should send apple dsyms from .xcarchive to public-api', async () => {
			const uploadingNock = nock('https://api.smartlook.cloud', {
				encodedQueryParams: true,
			})
				.post(
					'/api/v1/bundles/prod/platforms/ios/releases/0.0.1/mapping-files',
					(body) => {
						// Multipart with files will be hex encoded by default, need to decode it
						const stringBody = hexToString(body)
						for (let i = 1; i < 7; i++) {
							expect(
								stringBody.includes(
									`Content-Disposition: form-data; name="mappingFile-${i}"`
								)
							).toBeTruthy()
						}

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
				apiHost,
				platform: 'apple',
				internalAppVersion,
				force,
			})

			expect(uploadingNock.isDone()).toBeTruthy()
		})

		it('should send apple dsyms from .xcarchive to public-api and parse appVersion from Info.plist', async () => {
			const uploadingNock = nock('https://api.smartlook.cloud', {
				encodedQueryParams: true,
			})
				.post(
					'/api/v1/bundles/prod/platforms/ios/releases/6.9.0/mapping-files',
					(body) => {
						const stringBody = hexToString(body)
						for (let i = 1; i < 7; i++) {
							expect(
								stringBody.includes(
									`Content-Disposition: form-data; name="mappingFile-${i}"`
								)
							).toBeTruthy()
						}

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
				appVersion: undefined as unknown as string,
				apiHost,
				platform: 'apple',
				internalAppVersion,
				force,
			})

			expect(uploadingNock.isDone()).toBeTruthy()
		})

		it('should send single apple dsym to public-api', async () => {
			const uploadingNock = nock('https://api.smartlook.cloud', {
				encodedQueryParams: true,
			})
				.post(
					'/api/v1/bundles/prod/platforms/ios/releases/0.0.1/mapping-files',
					(body) => {
						expect(
							hexToString(body).includes(
								'Content-Disposition: form-data; name="mappingFile-1"'
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
				path: dsymPath,
				bundleId,
				appVersion,
				apiHost,
				platform: 'apple',
				internalAppVersion,
				force,
			})

			expect(uploadingNock.isDone()).toBeTruthy()
		})
	})
})
