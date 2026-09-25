FROM mcr.microsoft.com/devcontainers/typescript-node:22

# Install OpenCode: fetch the latest release from GitHub and install to /usr/local/bin
RUN ARCH=$(uname -m | sed 's/x86_64/x64/;s/aarch64/arm64/') && \
    VERSION=$(curl -fsSL https://api.github.com/repos/anomalyco/opencode/releases/latest | grep '"tag_name"' | sed 's/.*"v\([^"]*\)".*/\1/') && \
    curl -fsSL "https://github.com/anomalyco/opencode/releases/download/v${VERSION}/opencode-linux-${ARCH}.tar.gz" \
        | tar -xz -C /usr/local/bin opencode && \
    chmod +x /usr/local/bin/opencode

# Pre-create XDG state/share dirs so the node user can write to them at runtime
RUN mkdir -p /home/node/.local/state /home/node/.local/share && \
    chown -R node:node /home/node/.local