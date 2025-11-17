#!/bin/bash

echo "================================"
echo "Heritage Platform - Auto Setup"
echo "================================"
echo ""

# Backend Setup
echo "[1/4] Setting up Backend..."
cd backend
npm install
cp .env.example .env
echo "✓ Backend dependencies installed"

# Create database
echo ""
echo "[2/4] Setting up Database..."
createdb heritage 2>/dev/null || echo "Database already exists"
psql -U postgres -d heritage -f scripts/init-database.sql
echo "✓ Database initialized"

# Admin Dashboard Setup
echo ""
echo "[3/4] Setting up Admin Dashboard..."
cd ../admin-dashboard
npm install
cp .env.example .env
echo "✓ Admin Dashboard dependencies installed"

# Summary
echo ""
echo "================================"
echo "✓ Setup Complete!"
echo "================================"
echo ""
echo "To start the project:"
echo "  1. Backend:    cd backend && npm run start:dev"
echo "  2. Dashboard:  cd admin-dashboard && npm run dev"
echo ""
echo "Login credentials:"
echo "  Email: admin@heritage.com"
echo "  Password: admin123"
echo ""
echo "================================"
