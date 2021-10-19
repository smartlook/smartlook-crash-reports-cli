FROM node:14 as base

ENV HOME /home/node/app

COPY package.json $HOME/package.json
COPY yarn.lock $HOME/yarn.lock
COPY ./bin $HOME/bin

WORKDIR $BUILD_HOME



FROM base as build

ENV HOME /home/node/app

COPY ./src $HOME/src

RUN yarn --frozen-lockfile --non-interactive --production && yarn cache clean
# add build



FROM base as runtime

# COPY build
# COPY --from=builder /root/ ./
# COPY node_modules
# COPY --from=builder /root/ ./

RUN yarn link

CMD ["sccu", "-h"]

ENTRYPOINT [ "sccu" ]
