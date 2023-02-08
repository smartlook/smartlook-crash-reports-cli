## smartlook-crash-reports-cli

This is CLI tool that allows to upload various mapping files to Smartlook using Smartlook REST API.

## Getting Started

### Dependencies

- npm
- yarn

### Installation

- with NPM

  `npm install --location=global @smartlook/smartlook-crash-reports-cli`

- with Yarn

  `yarn global add @smartlook/smartlook-crash-reports-cli`

### Usage

```
smartlook-crash-reports-cli [command] [options]

Options:
  -V, --version                      output the version number
  -h, --help                         display help for command

Commands:
  upload-mapping-file|umf [options]
  help [command]                     display help for command
```

#### Options for `smartlook-crash-reports-cli upload-mapping-file`

```
Usage: smartlook-crash-reports-cli upload-mapping-file|umf [options]

Options:
  -p --path <value>              Path to mapping file to be uploaded - for Apple either path to.xcarchive or single dSYM file. Can be set as ENV variable PATH_TO_MAPING_FILE
  -t --token <value>             API token to access Smartlook REST API. Can be set as ENV variable API_TOKEN
  -b --bundleId <value>          BundleId of Application related to uploaded mapping file. Can be set as ENV variable BUNDLE_ID
  -pl --platform <value>         Platform of Application related to uploaded mapping file. Supported values are `android` and `apple`. Can be set as ENV variable PLATFORM
  -av --appVersion <value>       Version of Application related to uploaded mapping file. Can be set as ENV variable APP_VERSION
  -iv --internalVersion <value>  Internal version of Application related to uploaded mapping file. Can be set as ENV variable INTERNAL_VERSION
  -h, --help                     display help for command

Example:
  smartlook-crash-reports-cli upload-mapping-file -t <rest-api-token> -p mapping-file.txt -b com.example.app -pl android -av 0.0.1 -iv build.1234

  smartlook-crash-reports-cli upload-mapping-file -t <rest-api-token> -p Example.dSYM -b com.example.app -pl apple -av 0.0.1 -iv build.1234
```
