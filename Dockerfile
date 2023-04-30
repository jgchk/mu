FROM node:alpine AS builder
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
FROM node:alpine AS installer
RUN apk add --no-cache libc6-compat
RUN apk update

WORKDIR /app

# Set up pnpm
RUN npm i -g pnpm
ENV PNPM_HOME=/app/.pnpm
ENV PATH=$PNPM_HOME:$PATH

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

# First install dependencies (as they change less often)
COPY .gitignore .gitignore
COPY --from=builder /app/out/json/ .
COPY --from=builder /app/out/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=builder /app/out/pnpm-workspace.yaml ./pnpm-workspace.yaml
RUN pnpm install

# Build the project and its dependencies
COPY --from=builder /app/out/full/ .
COPY turbo.json turbo.json

RUN pnpm turbo run build --filter=server...

FROM node:alpine AS runner
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

COPY --from=installer /app .

CMD cd apps/server && node ./dist/server.js