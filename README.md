# Snapi

App that captures high-quality screenshots of websites using Playwright.

## Features

- 🚀 Built with Next.js 14 App Router
- 📸 High-quality website screenshots using Playwright
- 🎨 Modern UI with Shadcn UI and Tailwind CSS
- 🔒 Type-safe with TypeScript
- 📱 Responsive design
- ⚡ Server-side rendering for optimal performance

## Prerequisites

- Node.js 18.x or later
- npm or pnpm (recommended)
- Git

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/yourusername/website-screenshot-app.git
cd website-screenshot-app
```

2. Install dependencies:
```bash
pnpm install
```

3. Set up Playwright:
```bash
# Install Playwright browsers
pnpm exec playwright install

# Install Playwright system dependencies
pnpm exec playwright install-deps
```

4. Create a `.env.local` file:
```bash
cp .env.example .env.local
```

5. Start the development server:
```bash
pnpm dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

## Environment Setup

### Required Environment Variables

Create a `.env.local` file with the following variables:

```env
# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Add any additional environment variables here
```

### Playwright Configuration

The project uses Playwright for capturing website screenshots. The configuration can be found in `playwright.config.ts`. Key settings include:

- Viewport sizes
- Screenshot quality
- Browser type (Chromium by default)
- Timeout settings

## Development

```bash
# Start development server
pnpm dev

# Run type checking
pnpm type-check

# Run linting
pnpm lint

# Run tests
pnpm test
```

## Contributing

1. Fork the repository
2. Create a new branch
3. Make your changes
4. Submit a pull request

## License

MIT License - see LICENSE file for details
