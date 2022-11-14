import archiver from 'archiver'
import * as fs from 'fs'
import FormData from 'form-data'
import got from 'got'
import * as plist from 'plist'
import glob from 'glob'

interface AppIdentifiers {
	appVersion?: string
	bundleId?: string
	internalAppVersion?: string
}

interface CLIArgs {
	path: string
	token: string
	appVersion: string
	apiHost: string
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

const isXcarchive = (path: string): boolean => !!path.match(/\.xcarchive$/)

function validateInput(args: CLIArgs) {
	if (!args.platform) {
		throw new Error('Missing path')
	}
	if (!args.path) {
		throw new Error('Missing path')
	}
	if (!args.token) {
		throw new Error('Missing token')
	}
	if (!args.appVersion) {
		throw new Error('Missing App version')
	}
	if (!args.bundleId) {
		throw new Error('Missing bundleId')
	}
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
	packedDsyms?: archiver.Archiver[]
): RequestOptions {
	const searchParams = { force: args.force == true ? 'true' : 'false' }
	const form = new FormData()

	if (args.platform === 'android') {
		const readMappingFile = fs.createReadStream(args.path)
		form.append('mappingFile', readMappingFile)
	} else {
		packedDsyms?.forEach((dsym, index) => {
			form.append(`mappingFile-${index + 1}`, dsym, {
				knownLength: dsym.pointer(),
				contentType: 'application/gzip',
			})
		})
	}
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

async function getDsymPaths(path: string): Promise<string[]> {
	const dsymPaths = await new Promise<string[]>((resolve, reject) => {
		glob('**/*.dSYM', { cwd: path }, (err, dirs) => {
			if (err) {
				reject(err)
			}

			resolve(dirs)
		})
	})
	return dsymPaths
}

async function packDsym(dsymPath: string): Promise<archiver.Archiver> {
	const archive = archiver('tar', { gzip: true })
	const dsymName = dsymPath.split('/').pop()

	archive.directory(`${dsymPath}`, dsymName || false)

	return await new Promise((resolve, reject) => {
		archive.on('finish', async () => resolve(archive))
		archive.on('error', (e: Error) => reject(e))

		archive.finalize()
	})
}

async function uploadIos(destinationUrl: string, args: CLIArgs): Promise<void> {
	let gzippedDsyms: archiver.Archiver[] = []

	if (!isXcarchive(args.path)) {
		gzippedDsyms.push(await packDsym(args.path))
	} else {
		const dsymPaths = await getDsymPaths(args.path)
		const promises = dsymPaths.map(async (dsymPath) =>
			packDsym(`${args.path}/${dsymPath}`)
		)
		gzippedDsyms = await Promise.all(promises)
	}

	const requestOptions = makeOptions(args, gzippedDsyms)

	try {
		await upload(destinationUrl, requestOptions)
	} catch (e) {
		console.log(e)
		throw e
	}
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
		if (args.platform === 'ios' && isXcarchive(args.path)) {
			const appIdentifiers = await parseIdentifiersFromPlist(args.path)
			args = mergeArgs(args, appIdentifiers)
		}
		validateInput(args)
	} catch (e) {
		console.error(e)
		return
	}

	const publicApiUrl = `${args.apiHost}/api/v1/bundles/${args.bundleId}/platforms/${args.platform}/releases/${args.appVersion}/mapping-files`

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
