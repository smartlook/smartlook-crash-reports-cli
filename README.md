## Smartlook Crash CLI Upload

Smartlook Crash CLI Upload is CLI tool that allows to upload source map file to S3 bucket using Smartlook Public API.

## Getting Started

### Dependencies
- npm
- yarn

### Installation

- with NPM

  ```npm install -g smartlook-crash-cli-upload```
- with Yarn

    ```yarn global add smartlook-crash-cli-upload```

### Usage

```
smartlook-crash-cli-upload [command] [options]

Options:
  -V, --version                      output the version number
  -h, --help                         display help for command

Commands:
  upload-mapping-file|umf [options]
  help [command]                     display help for command

Aliases:
  sccu
```

#### Options for `smartlook-crash-cli-upload upload-mapping-file`
```
Usage: smartlook-crash-cli-upload upload-mapping-file|umf [options]

Options:
  -p --path <value>              Path to mapping file to be uploaded. Can be set as ENV variable PATH_TO_MAPING_FILE
  -t --token <value>             API token to access Smartlook Public API. Can be set as ENV variable API_TOKEN
  -b --bundleId <value>          BundleId of Application related to uploaded mapping file. Can be set as ENV variable BUNDLE_ID
  -pl --platform <value>         Platform of Application related to uploaded mapping file. Supported values are `android` and `ios`. Can be set as ENV variable PLATFORM
  -av --appVersion <value>       Version of Application related to uploaded mapping file. Can be set as ENV variable APP_VERSION
  -iv --internalVersion <value>  Internal version of Application related to uploaded mapping file. Can be set as ENV variable INTERNAL_VERSION
  -h, --help                     display help for command

Example:
  smartlook-crash-cli-upload upload-mapping-file -t apiToken132456 -p mapping-file.txt -b prod -pl android -av 0.0.1 -iv build.1234
```

