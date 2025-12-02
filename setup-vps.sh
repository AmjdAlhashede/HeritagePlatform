#!/bin/bash

# Exit on error
set -e

echo "Starting deployment setup..."

# Update system
echo "Updating system packages..."
apt-get update && apt-get upgrade -y

# Install Docker if not exists
if ! command -v docker &> /dev/null; then
    echo "Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
else
    echo "Docker is already installed."
fi

# Install Docker Compose plugin
echo "Installing Docker Compose..."
apt-get install -y docker-compose-plugin

# Create project directory
mkdir -p /opt/heritage-platform
cd /opt/heritage-platform

echo "Setup complete. You can now copy your project files to /opt/heritage-platform and run 'docker compose up -d'."
