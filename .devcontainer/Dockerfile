FROM mcr.microsoft.com/devcontainers/typescript-node:22

# poppler-utils liefert pdftotext, pdfinfo und pdfimages. Das Skript scripts/buch-pruefen.mjs
# braucht sie, um den fertigen Buchumbruch am PDF zu messen statt am DOM.
#
# default-jre-headless liefert die Laufzeit für epubcheck. Das Programm selbst steckt
# in node_modules/epub-check, aber es ist ein Java-Programm. Ohne die Laufzeit prüft
# scripts/epub-pruefen.mjs nur die eigene Struktur und meldet sich nicht als bestanden.
RUN apt-get update && \
    apt-get install -y --no-install-recommends poppler-utils default-jre-headless && \
    rm -rf /var/lib/apt/lists/*

# Chrome für scripts/make-pdf.mjs. Die Bibliotheken kommen aus apt, das Browser-Binary
# aus dem Puppeteer-CLI: so hängt die Chrome-Version an der gepinnten puppeteer-Version in
# package.json, und arm64 bekommt dieselbe Quelle wie amd64. Das apt-Paket
# google-chrome-stable wäre hier falsch, weil es die Bibliotheksversionen mitbringt und
# arm64 nicht in jedem Mirror liegt.
ENV PUPPETEER_CACHE_DIR=/home/node/.cache/puppeteer

# Achtung: die puppeteer-Version muss der devDependency in package.json entsprechen,
# sonst installiert der Cache ein Chrome, das nicht zur gepinnten Puppeteer-Version passt.
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        libasound2 \
        libatk-bridge2.0-0 \
        libatk1.0-0 \
        libatspi2.0-0 \
        libcups2 \
        libdbus-1-3 \
        libdrm2 \
        libgbm1 \
        libgtk-3-0 \
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
        xdg-utils \
        fonts-liberation && \
    rm -rf /var/lib/apt/lists/* && \
    npx --yes puppeteer@25.12.0 browsers install chrome && \
    rm -rf /root/.npm/_npx && \
    chown -R node:node /home/node/.cache

# Install OpenCode: fetch the latest release from GitHub and install to /usr/local/bin
RUN ARCH=$(uname -m | sed 's/x86_64/x64/;s/aarch64/arm64/') && \
    VERSION=$(curl -fsSL https://api.github.com/repos/anomalyco/opencode/releases/latest | grep '"tag_name"' | sed 's/.*"v\([^"]*\)".*/\1/') && \
    curl -fsSL "https://github.com/anomalyco/opencode/releases/download/v${VERSION}/opencode-linux-${ARCH}.tar.gz" \
        | tar -xz -C /usr/local/bin opencode && \
    chmod +x /usr/local/bin/opencode

# Pre-create XDG state/share dirs so the node user can write to them at runtime
RUN mkdir -p /home/node/.local/state /home/node/.local/share && \
    chown -R node:node /home/node/.local