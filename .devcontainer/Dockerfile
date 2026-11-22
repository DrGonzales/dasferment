FROM mcr.microsoft.com/devcontainers/typescript-node:22-trixie

ENV PUPPETEER_CACHE_DIR=/home/node/.cache/puppeteer

# poppler-utils liefert pdftotext, pdfinfo und pdfimages für scripts/buch-pruefen.mjs.
# default-jre-headless ist die Laufzeit für epubcheck aus node_modules/epub-check.
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        default-jre-headless \
        poppler-utils && \
    rm -rf /var/lib/apt/lists/*

# Chrome für scripts/make-pdf.mjs. Debian trixie kennt mehrere Bibliotheken nur noch
# unter *t64, die Namen aus bookworm gibt es hier nicht mehr. Die Version kommt aus
# der gepinnten puppeteer-Version in package.json, damit sie zur Bibliothek passt.
COPY package.json /tmp/package.json
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        fonts-liberation \
        libasound2t64 \
        libatk-bridge2.0-0t64 \
        libatk1.0-0t64 \
        libatspi2.0-0t64 \
        libcups2t64 \
        libdbus-1-3 \
        libdrm2 \
        libgbm1 \
        libgtk-3-0t64 \
        libnspr4 \
        libnss3 \
        libpango-1.0-0 \
        libx11-6 \
        libxcb1 \
        libxcomposite1 \
        libxdamage1 \
        libxext6 \
        libxfixes3 \
        libxkbcommon0 \
        libxrandr2 \
        xdg-utils && \
    rm -rf /var/lib/apt/lists/* && \
    PUPPETEER_VERSION=$(node -p "require('/tmp/package.json').devDependencies.puppeteer") && \
    npx --yes "puppeteer@${PUPPETEER_VERSION}" browsers install chrome && \
    rm -rf /root/.npm/_npx /tmp/package.json && \
    chown -R node:node /home/node/.cache

# Feste Version statt GitHub releases/latest: dort liegt aktuell v1, während das
# offizielle npm-Paket v2 für amd64 und arm64 ausliefert.
ARG OPENCODE_VERSION=2.3.2
RUN npm install -g "@opencode/cli@${OPENCODE_VERSION}"

RUN mkdir -p /home/node/.local/state /home/node/.local/share && \
    chown -R node:node /home/node/.local
