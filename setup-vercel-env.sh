#!/bin/bash

# Add Auth0 environment variables to Vercel
echo "Adding Auth0 environment variables to Vercel..."

# AUTH0_SECRET
echo "11284e113a8568224aadfe9afc3f0c14f8daef8a56ecec88fdb86788a42ec028" | vercel env add AUTH0_SECRET production

# AUTH0_DOMAIN
echo "dev-lawlsypxo8s3bt4y.us.auth0.com" | vercel env add AUTH0_DOMAIN production

# AUTH0_BASE_URL - Must match your deployment URL exactly
echo "https://checkpoint-fawn.vercel.app" | vercel env add AUTH0_BASE_URL production

# APP_BASE_URL (legacy - keep for compatibility)
echo "https://checkpoint-fawn.vercel.app" | vercel env add APP_BASE_URL production

# AUTH0_CLIENT_ID
echo "Oft0hgALGYczF5q6aO9IuJcCGqVlYfaR" | vercel env add AUTH0_CLIENT_ID production

# AUTH0_CLIENT_SECRET
echo "V5Wnz2DRcC5xzfcVZnKEp2csA5NRi47jgj3crft9Pgis_CJ-rO8jLf6k1Ao8xdyO" | vercel env add AUTH0_CLIENT_SECRET production

# Cookie settings to ensure cookies are sent with requests
echo "Lax" | vercel env add AUTH0_COOKIE_SAME_SITE production
echo "true" | vercel env add AUTH0_SECURE_COOKIE production

echo "Environment variables added successfully!"
echo ""
echo "⚠️  IMPORTANT: After adding these, redeploy your application for changes to take effect."
