import * as commander from 'commander';
import {uploadMappingFile} from "./lib/commands/upload-mapping-file";

const pjson = require('../package.json');

async function run() {
    const cmder = new commander.Command();

    cmder
        .version(pjson.version)
        .name('smartlook-crash-cli-upload')
        .usage('[command] [options] ')
        .on('--help', () => {
            console.log('');
            console.log('Aliases:');
            console.log('  sccu');
        });

    cmder
        .command('upload-mapping-file')
        .alias('umf')
        .usage('[path] [apiToken] [appVersion] [internalVersion]')
        // TODO default from env
        .option("-p --path <value>")
        .option("-t --token <value>")
        .option("-av --appVersion <value>")
        .option("-iv --internalVersion <value>")
        .action(uploadMappingFile)

    await cmder.parseAsync(process.argv)
}

export default run