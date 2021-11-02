TAG=latest # todo read from package json
build-docker:
	docker build -t smartlook/smartlook-crash-cli-upload:$(TAG) .
