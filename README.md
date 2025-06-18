# Cloudflare App Store / Play Store Redirects

A TypeScript-based Cloudflare Worker that intelligently redirects users to the appropriate app store (iOS App Store or Google Play Store) based on their device's user agent, with a fallback URL for other devices.

## Features

- 🎯 **Smart Detection**: Automatically detects iOS and Android devices from User-Agent headers
- 📱 **Multi-Platform Support**: Handles iPhone, iPad, and Android devices
- 🔄 **Fallback Support**: Redirects to a specified fallback URL for desktop or unrecognized devices
- ⚡ **Fast Performance**: Cloudflare Workers provide global edge performance
- 🧪 **Well Tested**: Comprehensive test suite included
- 🔧 **TypeScript**: Full type safety and modern development experience

## How It Works

The worker examines the `User-Agent` header of incoming requests and:

1. **iOS Devices** (iPhone, iPad, iPod) → Redirects to `APPSTORE_URL`
2. **Android Devices** → Redirects to `PLAYSTORE_URL`
3. **Other Devices** (Desktop, etc.) → Redirects to `FALLBACK`

## Quick Start

### Prerequisites

- Node.js 18+ and pnpm
- Cloudflare account
- Wrangler CLI installed globally: `npm install -g wrangler`

### Installation

```bash
# Clone and install dependencies
cd cloudflare-appstore-redirect
pnpm install

# Login to Cloudflare (if not already done)
wrangler login
```

### Environment Variables

Set your environment variables in Cloudflare:

```bash
# Set your app store URLs and fallback
wrangler secret put APPSTORE_URL
# Enter: https://apps.apple.com/app/a-course-in-miracles-ce/id6448315664

wrangler secret put PLAYSTORE_URL
# Enter: https://play.google.com/store/apps/details?id=org.circleofa.acimce

wrangler secret put FALLBACK
# Enter: https://news.acimce.app
```

### Development

```bash
# Start local development server
pnpm dev

# The worker will be available at http://localhost:8787
```

### Testing

```bash
# Run the test suite
pnpm test

# Type checking
pnpm type-check
```

### Deployment

```bash
# Deploy to Cloudflare
pnpm deploy
```

## Configuration

### Environment Variables

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `APPSTORE_URL` | iOS App Store URL | No* | `https://apps.apple.com/app/a-course-in-miracles-ce/id6448315664` |
| `PLAYSTORE_URL` | Google Play Store URL | No* | `https://play.google.com/store/apps/details?id=org.circleofa.acimce` |
| `FALLBACK` | Fallback URL for other devices | **Yes** | `https://news.acimce.app` |

*While not strictly required, you should set at least one store URL for the redirect to be useful.

### Custom Domain (Optional)

To use a custom domain, update `wrangler.toml`:

```toml
[[env.production.routes]]
pattern = "go.yourapp.com/*"
zone_name = "yourapp.com"
```

## API

### Request

- **Method**: GET
- **Headers**: Standard HTTP headers (User-Agent is analyzed)

### Response

- **Status**: 302 (Redirect)
- **Headers**:
  - `Location`: The redirect URL
  - `Cache-Control`: `public, max-age=300` (5 minutes)
  - `X-Redirect-Reason`: `User-Agent based redirect`

### Error Responses

- **405**: Method not allowed (non-GET requests)
- **500**: Server error (missing FALLBACK variable)

## User Agent Detection

The worker detects devices using these patterns:

- **iOS**: `/iphone|ipad|ipod/i`
- **Android**: `/android/i`
- **Mobile**: Combination of above plus `/mobile/i`

## Examples

### iOS Device
```bash
curl -H "User-Agent: Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)" \
  https://your-worker.your-subdomain.workers.dev
# → Redirects to APPSTORE_URL
```

### Android Device
```bash
curl -H "User-Agent: Mozilla/5.0 (Linux; Android 13; SM-G998B)" \
  https://your-worker.your-subdomain.workers.dev
# → Redirects to PLAYSTORE_URL
```

### Desktop Browser
```bash
curl -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64)" \
  https://your-worker.your-subdomain.workers.dev
# → Redirects to FALLBACK
```

## Testing User Agents

Common User-Agent strings for testing:

```javascript
// iOS
"Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15"
"Mozilla/5.0 (iPad; CPU OS 16_0 like Mac OS X) AppleWebKit/605.1.15"

// Android
"Mozilla/5.0 (Linux; Android 13; SM-G998B) AppleWebKit/537.36 Mobile Safari/537.36"

// Desktop
"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Safari/537.36"
```

## Development Scripts

```bash
pnpm dev        # Start development server
pnpm deploy     # Deploy to Cloudflare
pnpm build      # Build (dry-run deploy)
pnpm test       # Run tests
pnpm type-check # TypeScript type checking
```

## Monitoring

Monitor your worker in the Cloudflare dashboard:
- View request logs and errors
- Monitor performance metrics
- Set up alerts for errors

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass: `pnpm test`
5. Submit a pull request

## License

ISC License - see LICENSE file for details.

## Troubleshooting

### Common Issues

**"FALLBACK environment variable is required"**
- Ensure you've set the FALLBACK secret: `wrangler secret put FALLBACK`

**Worker not redirecting correctly**
- Check the User-Agent header in your request
- Verify environment variables are set in Cloudflare dashboard
- Check worker logs for debugging information

**Local development not working**
- Ensure you're using Node.js 18+
- Try `pnpm install` to reinstall dependencies
- Check that wrangler is logged in: `wrangler whoami`

### Getting Help

- Check [Cloudflare Workers documentation](https://developers.cloudflare.com/workers/)
- Review worker logs in Cloudflare dashboard
- Open an issue in this repository
