FROM node:18

#############################################
# Set up dependencies
#############################################

# Install pnpm
RUN npm install -g pnpm

# Install dependencies
RUN apt-get update \
    && apt-get install -y python3 python3-pip python3-mutagen python3-six libasound2-dev ffmpeg

# Install Rust using rustup
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
ENV PATH="/root/.cargo/bin:${PATH}"

#############################################
# Build the app
#############################################

# Set a working directory
WORKDIR /app

# Your app setup can continue from here...
COPY . .
RUN pnpm install
RUN pnpm turbo run build --filter=server...

#############################################
# Run the app
#############################################

# Set up environment variables
ENV DATABASE_URL=/data/db.sqlite
ENV SERVER_HOST=0.0.0.0
ENV SERVER_PORT=3001
ENV MUSIC_DIR=/data/music
ENV DOWNLOAD_DIR=/data/downloads
ENV IMAGES_DIR=/data/images
ENV ORIGIN=http://localhost:3001
ENV LEVEL=info
ENV BODY_SIZE_LIMIT=0

CMD cd apps/server && node ./dist/server.js
