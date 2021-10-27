import * as fs from 'fs'
import got from "got";
import FormData from 'form-data'

interface CLIArgs {
    path: string;
    token: string;
    appVersion: string;
    internalVersion: string;
    force?: boolean;
}

function validateInput(args: CLIArgs) {
    if (!args.path) {
        throw new Error("Missing path")
    }
    if (!args.token) {
        throw new Error("Missing token")
    }
    if (!args.appVersion) {
        throw new Error("Missing App version")
    }
    if (!args.internalVersion) {
        throw new Error("Missing internal App version")
    }
}

function makeOptions(args: CLIArgs) {
    const searchParams = {'force': args.force == true ? 'true' : 'false'}

    const form = new FormData()
    const readMappingFile = fs.createReadStream(args.path)
    form.append('mappingFile', readMappingFile)
    form.append('internalVersion', args.internalVersion)

    const headers = {'Authorization': `Bearer ${args.token}`, ...form.getHeaders()}

    return {
        searchParams,
        headers,
        body: form,
    }
}

export async function uploadTo(destinationUrl: string, args: CLIArgs) {
    const requestOptions = makeOptions(args)

    console.log("Started uploading mapping file")
    const request = await got.stream.post(destinationUrl, requestOptions).on('error', (err) => {
        console.log("Uploading mapping file failed")
        console.log(err)
    }).on('finish', () => {
        console.log('Uploading file finished');
    })


    request.pipe(process.stdout)
}

export async function uploadMappingFile(args: CLIArgs) {
    try {
        validateInput(args)
    } catch (e) {
        console.log(e)
        return
    }

    const publicApiUrl = process.env.ENV === 'DEV' ? `https://public-api.alfa.smartlook.cloud/api/v1/releases/${args.appVersion}/mapping-files` : `prod url`
    await uploadTo(publicApiUrl, args)
}