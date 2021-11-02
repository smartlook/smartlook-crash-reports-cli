import * as commander from 'commander';
import {uploadMappingFile} from "./lib/commands/upload-mapping-file";

const pjson = require('../package.json');

async function run() {
    const cmder = new commander.Command();

    cmder
        .version(pjson.version)
        .name('smartlook-crash-cli-upload')
        .alias('sccu')
        .usage('[command] [options] ')
        .on('--help', () => {
            console.log('');
            console.log('Aliases:');
            console.log('  sccu');
        });

    cmder
        .command('upload-mapping-file')
        .alias('umf')
        .option("-p --path <value>", "Path to mapping file to be uploaded. Can be set as ENV variable PATH_TO_MAPING_FILE", process.env.PATH_TO_MAPING_FILE)
        .option("-t --token <value>", "API token to access Smartlook Public API. Can be set as ENV variable API_TOKEN", process.env.API_TOKEN)
        .option("-av --appVersion <value>", "Version of Application related to uploaded mapping file. Can be set as ENV variable APP_VERSION", process.env.APP_VERSION)
        .option("-iv --internalVersion <value>", "Internal version of Application related to uploaded mapping file. Can be set as ENV variable INTERNAL_APP_VERSION", process.env.INTERNAL_APP_VERSION)
        .option("-f --force", "Argument to force the mapping file upload", process.env.FORCE)
        .action(uploadMappingFile)

    await cmder.parseAsync(process.argv)
}

export default run