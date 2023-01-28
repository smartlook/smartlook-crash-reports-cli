import * as FormDataLib from 'form-data'

export interface AppIdentifiers {
	appVersion?: string
	bundleId?: string
	internalAppVersion?: string
}

export interface CLIArgs {
	path: string
	token: string
	appVersion: string
	apiHost: string
	platform: 'android' | 'apple'
	bundleId: string
	internalAppVersion?: string
	force?: boolean
}

export interface RequestOptions {
	searchParams: Record<string, string>
	body: FormDataLib
	headers: Record<string, string>
}

export interface InfoPlistFile {
	ApplicationProperties?: {
		CFBundleIdentifier?: string
		CFBundleShortVersionString?: string
		CFBundleVersion?: string
	}
}

export interface IUploadJobData {
	filename: string
}

export interface IDSymInfo {
	path: string
	binary: string
	arch: string
	uuid: string
}

export type PlatformExtractor = (args: CLIArgs) => Promise<RequestOptions>
