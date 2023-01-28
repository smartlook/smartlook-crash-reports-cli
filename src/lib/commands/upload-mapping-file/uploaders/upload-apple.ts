import { execSync } from 'child_process'
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as os from 'node:os'

import glob from 'glob'
import archiver from 'archiver'
import FormData from 'form-data'

import { error, info, debug } from '../../../logger'
import { isXcarchive } from '../helpers'
import { CLIArgs, IDSymInfo, RequestOptions } from '../types'

function getDsymPaths(basePath: string): string[] {
	debug('looking for dSYM in %s', basePath)
	const dsymPaths = glob.sync('**/*.dSYM', {
		cwd: basePath,
		realpath: true,
		absolute: true,
	})

	debug('discovered dSYMs: %j', dsymPaths)

	return dsymPaths
}

function parseDwarfdumpOutput(ddOutput: string) {
	const result =
		/^UUID: (?<uuid>[^ ]*) \((?<arch>[^\)]*)\) (?<binary>.*)/m.exec(ddOutput)

	return {
		arch: result?.groups?.arch,
		uuid: result?.groups?.uuid,
		binary: result?.groups?.binary,
	}
}

async function packDsym(dsymInfo: IDSymInfo): Promise<string> {
	const archive = archiver('tar', { gzip: true })
	const dsymName = path.basename(dsymInfo.path)
	const binaryName = path.basename(dsymInfo.binary)

	return new Promise((resolve, reject) => {
		const localDebug = debug.extend(`packing:${dsymName}`)
		localDebug.color = '8'

		info('packing %s (UUID: %s)', dsymName, dsymInfo.uuid)

		const tmpPath = fs.mkdtempSync(
			path.resolve(process.env.TMP_DIR || os.tmpdir(), 'smartlook-')
		)
		const outputPath = path.join(tmpPath, `${binaryName}.tar.gz`)

		localDebug('packing %s to %s', dsymInfo.path, outputPath)

		const stats = fs.statSync(dsymInfo.path)

		if (stats.isDirectory()) {
			archive.directory(dsymInfo.path, dsymName)
		} else if (stats.isFile()) {
			archive.file(dsymInfo.path, {
				name: dsymName,
			})
		}

		archive.on('finish', async () => {
			localDebug('archiver for %s finished', dsymName)
		})
		archive.on('error', (err: Error) => {
			reject(err)
		})
		archive.on('warning', function (err) {
			reject(err)
		})

		const outputStream = fs.createWriteStream(outputPath)
		archive.pipe(outputStream)
		archive.finalize()
		outputStream.on('close', () => {
			info('dSYM %s packed to %s', dsymName, path.basename(outputPath))
			localDebug('writing of %s is finalized ', dsymName)
			resolve(outputPath)
		})
	})
}

function extractDsymInfo(dsymPath: string): IDSymInfo | null {
	const cmdString = `dwarfdump -u "${dsymPath}"`

	debug('running %s', cmdString)

	const output = execSync(cmdString, {
		stdio: ['pipe', 'pipe', 'ignore'],
	}).toString('ascii')

	debug('dwarfdump output: %s', output)

	const parsedOutput = parseDwarfdumpOutput(output)
	debug('parsed dwarfdump output: %j', parsedOutput)

	if (!parsedOutput.binary || !parsedOutput.uuid || !parsedOutput.arch) {
		return null
	}

	return {
		arch: parsedOutput.arch,
		binary: parsedOutput.binary,
		uuid: parsedOutput.uuid,
		path: dsymPath,
	}
}

async function extractAndPackDsyms(basePath: string) {
	const dsymPaths: string[] = []

	if (!isXcarchive(basePath)) {
		dsymPaths.push(basePath)
	} else {
		info('.xcarchive detected - extracting dSYMs')

		const discoveredDSyms = getDsymPaths(basePath)
		dsymPaths.push(...discoveredDSyms)
	}

	if (dsymPaths.length === 0) {
		return null
	}

	info('%d dSYMs found', dsymPaths.length)

	const dsymsInfo: IDSymInfo[] = dsymPaths
		.map((dsymPath) => {
			try {
				return extractDsymInfo(dsymPath)
			} catch (err: any) {
				error('dwarfdump failed, skipping')
				debug('dwarfdump error: %s', err.toString())
				return null
			}
		})
		.filter((dsymInfo): dsymInfo is IDSymInfo => dsymInfo !== null)

	const packPromises = dsymsInfo.map(async (dsymInfo) => {
		const packedDsymPath = await packDsym(dsymInfo)

		return { uuid: dsymInfo.uuid, path: packedDsymPath }
	})

	const gzippedDsyms = await Promise.all(packPromises)

	info('%d dSYMs packed', gzippedDsyms.length)

	return gzippedDsyms
}

export async function uploadApple(
	args: CLIArgs
): Promise<RequestOptions | null> {
	if (os.platform() !== 'darwin') {
		throw new Error(
			'Apple symbolication files must be uploaded on the Darwin platform.'
		)
	}

	const packedDsyms = await extractAndPackDsyms(args.path)

	if (!packedDsyms || packedDsyms.length === 0) {
		error('no symbol files found')
		return null
	}

	const searchParams = { force: args.force == true ? 'true' : 'false' }

	const form = new FormData()
	packedDsyms?.forEach((dsymPath, index) => {
		form.append(`mappingFile-${index}`, fs.readFileSync(dsymPath.path), {
			filename: path.basename(dsymPath.path),
			contentType: 'application/gzip, application/octet-stream',
			header: {
				'X-Content-UUID': dsymPath.uuid,
			},
		})
	})

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
