#!/bin/bash
# Run this once on a fresh Hetzner CX23 (Ubuntu 24.04)
# Usage: ssh root@YOUR_IP < scripts/server-init.sh

set -euo pipefail

echo "==> Updating system"
apt-get update && apt-get upgrade -y

echo "==> Installing Docker"
curl -fsSL https://get.docker.com | sh

echo "==> Installing Docker Compose plugin"
apt-get install -y docker-compose-plugin

echo "==> Creating deploy user"
useradd -m -s /bin/bash -G docker deploy
mkdir -p /home/deploy/.ssh
cp /root/.ssh/authorized_keys /home/deploy/.ssh/
chown -R deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys

echo "==> Cloning repository"
su - deploy -c "git clone https://github.com/labait/generative-playground.git ~/laba-ai-studio"

echo "==> Enabling firewall"
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

echo "==> Done! Next steps:"
echo "  1. Add GitHub Secrets (see README)"
echo "  2. Push to main to trigger deploy"
