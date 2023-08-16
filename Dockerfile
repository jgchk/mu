FROM node:18-alpine AS builder
RUN apk add --no-cache libc6-compat
RUN apk update

WORKDIR /app

# Set up pnpm
RUN npm i -g pnpm
ENV PNPM_HOME=/app/.pnpm
ENV PATH=$PNPM_HOME:$PATH

# Set working directory
RUN pnpm i -g turbo
COPY . .
RUN turbo prune --scope=server --docker

# Add lockfile and package.json's of isolated subworkspace
FROM node:18-alpine AS installer
RUN apk add --no-cache libc6-compat
# Install python/pip
ENV PYTHONUNBUFFERED=1
RUN apk add --update --no-cache python3 && ln -sf python3 /usr/bin/python
RUN python3 -m ensurepip
RUN pip3 install --no-cache --upgrade pip setuptools
# Install Rust & Cargo
RUN apk add --no-cache \
	build-base \
	curl \
	gcc \
	git \
	libffi-dev \
	openssl-dev \
	musl-dev
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
ENV PATH="/root/.cargo/bin:${PATH}"
# Install other build dependencies
RUN apk add alsa-utils alsa-utils-doc alsa-lib alsa-lib-dev alsaconf alsa-ucm-conf
# Update
RUN apk update

WORKDIR /app

# Set up pnpm
RUN npm i -g pnpm
ENV PNPM_HOME=/app/.pnpm
ENV PATH=$PNPM_HOME:$PATH

# First install dependencies (as they change less often)
COPY .gitignore .gitignore
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=builder /app/out/pnpm-workspace.yaml ./pnpm-workspace.yaml
RUN pnpm install

# Build spotify
COPY --from=builder /app/out/full/packages/spotify ./packages/spotify
COPY turbo.json turbo.json
RUN pnpm turbo run build --filter=spotify

# Build the project and its dependencies
COPY --from=builder /app/out/full/apps/client ./apps/client
COPY --from=builder /app/out/full/apps/server ./apps/server
COPY --from=builder /app/out/full/packages/bool-lang ./packages/bool-lang
COPY --from=builder /app/out/full/packages/context ./packages/context
COPY --from=builder /app/out/full/packages/db ./packages/db
COPY --from=builder /app/out/full/packages/downloader ./packages/downloader
COPY --from=builder /app/out/full/packages/env ./packages/env
COPY --from=builder /app/out/full/packages/eslint-config-custom ./packages/eslint-config-custom
COPY --from=builder /app/out/full/packages/image-manager ./packages/image-manager
COPY --from=builder /app/out/full/packages/last-fm ./packages/last-fm
COPY --from=builder /app/out/full/packages/log ./packages/log
COPY --from=builder /app/out/full/packages/music-metadata ./packages/music-metadata
COPY --from=builder /app/out/full/packages/musicbrainz ./packages/musicbrainz
COPY --from=builder /app/out/full/packages/mutils ./packages/mutils
COPY --from=builder /app/out/full/packages/soundcloud ./packages/soundcloud
COPY --from=builder /app/out/full/packages/trpc ./packages/trpc
COPY --from=builder /app/out/full/packages/utils ./packages/utils
RUN pnpm turbo run build --filter=server...

# Delete unnecessary rust build files
RUN rm -r ./packages/spotify/downloader/target/release/build
RUN rm -r ./packages/spotify/downloader/target/release/deps

FROM node:18-alpine AS runner

# Install python/pip
ENV PYTHONUNBUFFERED=1
RUN apk add ffmpeg
RUN apk add --update --no-cache python3 && ln -sf python3 /usr/bin/python
RUN python3 -m ensurepip
RUN pip3 install --no-cache --upgrade pip setuptools
RUN pip3 install mutagen six

WORKDIR /app

# Create a volume for the database
RUN mkdir -p /data
VOLUME /data

ENV DATABASE_URL=/data/db.sqlite
ENV SERVER_HOST=0.0.0.0
ENV SERVER_PORT=3001
ENV MUSIC_DIR=/data/music
ENV DOWNLOAD_DIR=/data/downloads
ENV IMAGES_DIR=/data/images
ENV ORIGIN=http://localhost:3001
ENV LEVEL=info
ENV BODY_SIZE_LIMIT=0

COPY --from=installer /app .

CMD cd apps/server && node ./dist/server.js
