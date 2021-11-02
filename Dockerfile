FROM node:14 as base

ENV HOME /home/node/app/smartlook-crash-cli-upload

COPY package.json $HOME/package.json
COPY yarn.lock $HOME/yarn.lock
COPY ./bin $HOME/bin

WORKDIR $HOME



FROM base as build

COPY ./src $HOME/src
COPY tsconfig.json $HOME/tsconfig.json

RUN yarn && yarn build



FROM base as runtime

COPY --from=build $HOME/lib $HOME/lib

RUN yarn --frozen-lockfile --non-interactive --production && yarn cache clean && yarn link --link-folder ~/.links

ENTRYPOINT [ "smartlook-crash-cli-upload" ]