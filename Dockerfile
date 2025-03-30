# Check out https://hub.docker.com/_/node to select a new base image
FROM node:20.11-alpine

# Set to a non-root built-in user `node`
USER node

# Create app directory (with user `node`)
RUN mkdir -p /home/node/dist/app

WORKDIR /home/node/dist/app
COPY --chown=node package*.json ./
RUN yarn install

ENV PORT=3270
COPY --chown=node . .
RUN yarn run build

EXPOSE ${PORT}
CMD [ "yarn", "start" ]
