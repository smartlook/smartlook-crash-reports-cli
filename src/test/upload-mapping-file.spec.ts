import {uploadMappingFile} from "../lib/commands/upload-mapping-file";
import nock from "nock";

describe('uploadMappingFile', () => {
    const token = 'api-token'
    const path = `${__dirname}/test-mapping-file.txt`
    const appVersion = '0.0.1'
    const internalAppVersion = 'beta.1234'

    it('should send mapping file to public-api', async () => {

        nock('https://public-api.alfa.smartlook.cloud:443', {"encodedQueryParams": true})
            .post('/api/v1/releases/0.0.1/mapping-files', (body) => {
                expect(body.toString().includes("content of test mapping file")).toEqual(true)
                return true
            })
            .query({"force": "true"})
            .reply(201, {});

        await uploadMappingFile({token, path, appVersion, internalAppVersion})
    })
})