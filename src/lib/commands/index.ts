import { Command } from 'commander'
import * as uploadMappingFile from './upload-mapping-file'

export const commandDecorators: Array<(cmder: Command) => Command> = [
	uploadMappingFile.decorateProgram,
]
