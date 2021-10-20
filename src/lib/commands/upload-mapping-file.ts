import * as fs from 'fs'
import got from "got";
import FormData from 'form-data'

interface CLIArgs {
    path: string;
    token: string;
    appVersion: string;
    internalAppVersion: string;
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
    if (!args.internalAppVersion) {
        throw new Error("Missing internal App version")
    }

}

export async function uploadMappingFile(args: CLIArgs) {
    try {
        validateInput(args)
    } catch (e) {
        console.log(e)
        return
    }
    const readMappingFile = fs.createReadStream(args.path)
    const form = new FormData()
    form.append('internalAppVersion', args.internalAppVersion)
    form.append('mappingFile', readMappingFile)
    const publicApiUrl = `https://public-api.alfa.smartlook.cloud/api/v1/releases/${args.appVersion}/mapping-files?force=true`
    const headers = {'Authorization': `Bearer ${args.token}`, ...form.getHeaders()}
    console.log("Started uploading mapping file")
    await got.stream.post(publicApiUrl, {
        headers,
        body: form
    }).on('error', (err) => {
        console.log("Uploading mapping file failed")
        console.log(err)
    })
}