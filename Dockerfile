FROM ubuntu:22.04

# Install system dependencies
RUN apt-get update
RUN apt-get install curl gcc pkg-config libasound2-dev python3-pip -y
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
RUN apt-get install nodejs -y
RUN npm i -g pnpm
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | bash -s -- -y
ENV PATH="/root/.cargo/bin:${PATH}"
RUN pip3 install mutagen six

# Create app directory
WORKDIR /app

# Install app dependencies
COPY package.json .
COPY pnpm-*.yaml .
COPY apps/client/package.json ./apps/client/
COPY apps/client/pnpm-*.yaml ./apps/client/
COPY apps/server/package.json ./apps/server/
COPY apps/server/pnpm-*.yaml ./apps/server/
COPY packages/bool-lang/package.json ./packages/bool-lang/
COPY packages/bool-lang/pnpm-*.yaml ./packages/bool-lang/
COPY packages/db/package.json ./packages/db/
COPY packages/db/pnpm-*.yaml ./packages/db/
COPY packages/downloader/package.json ./packages/downloader/
COPY packages/downloader/pnpm-*.yaml ./packages/downloader/
COPY packages/eslint-config-custom/package.json ./packages/eslint-config-custom/
COPY packages/eslint-config-custom/pnpm-*.yaml ./packages/eslint-config-custom/
COPY packages/image-manager/package.json ./packages/image-manager/
COPY packages/image-manager/pnpm-*.yaml ./packages/image-manager/
COPY packages/last-fm/package.json ./packages/last-fm/
COPY packages/last-fm/pnpm-*.yaml ./packages/last-fm/
COPY packages/log/package.json ./packages/log/
COPY packages/log/pnpm-*.yaml ./packages/log/
COPY packages/music-metadata/package.json ./packages/music-metadata/
COPY packages/music-metadata/pnpm-*.yaml ./packages/music-metadata/
COPY packages/soundcloud/package.json ./packages/soundcloud/
COPY packages/soundcloud/pnpm-*.yaml ./packages/soundcloud/
COPY packages/spotify/package.json ./packages/spotify/
COPY packages/spotify/pnpm-*.yaml ./packages/spotify/
COPY packages/trpc/package.json ./packages/trpc/
COPY packages/trpc/pnpm-*.yaml ./packages/trpc/
COPY packages/utils/package.json ./packages/utils/
COPY packages/utils/pnpm-*.yaml ./packages/utils/
RUN pnpm install

# Bundle app source
COPY . .

# Build app
RUN pnpm build

CMD [ "pnpm", "start" ]
