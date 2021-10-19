import * as fs from 'fs'
import got from "got";

interface CLIArgs {
    path: string;
    token: string;
    appVersion: string;
    internalVersion: string;
}

export async function uploadMappingFile(args: CLIArgs) {
    console.log("running upload with args:", args)
    const readMappingFile = fs.createReadStream(args.path)

    const publicApiUrl = `smartlook-public-api-url/api/v1/releases/${args.appVersion}/mapping-files?force=true`
    const headers = {authorization: args.token, 'Content-Type': 'multipart', appVersion: args.appVersion}
    try {
        await got.stream.post(publicApiUrl, {
            headers,
            body: JSON.stringify({internalAppVersion: args.internalVersion, mappingFile: readMappingFile})
        })
    } catch (err) {
        console.log(err)
        console.log("Streaming mapping file to public API failed")
    }
}