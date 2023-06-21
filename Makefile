TAG=latest # todo read from package json

build-all: build-binary

build-ts:
	npx rimraf build && npx tsc -b

build-bundle: build-ts
build-bundle:
	npx rimraf dist
	npx rollup --config rollup.config.js --bundleConfigAsCjs
	echo "#!/usr/bin/env node\n" `cat dist/index.js` > dist/index.js
	chmod +x dist/index.js

build-binary: build-bundle
build-binary:
	npx rimraf bin
	npx rimraf release
	npx pkg --output release/smartlook-crash-reports .
	cd release;tar -czvf smartlook-crash-reports.tar.gz *

build-docker:
	docker build -t smartlook/smartlook-crash-cli-upload:$(TAG) .