# Website Screenshot App

A modern Next.js 14 application that captures high-quality screenshots of websites using Playwright.

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

## Testing

The project uses Playwright for end-to-end testing:

```bash
# Run e2e tests
pnpm test:e2e

# Run e2e tests with UI
pnpm test:e2e:ui

# Generate test report
pnpm test:report
```

## Deployment

The application can be deployed to any platform that supports Next.js applications (Vercel, Railway, etc.).

1. Build the application:
```bash
pnpm build
```

2. Start the production server:
```bash
pnpm start
```

### Deploying to Vercel

The easiest way to deploy is using Vercel:

1. Push your code to a Git repository
2. Import the project in Vercel
3. Configure environment variables
4. Deploy

## Project Structure

```
website-screenshot-app/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── components/        # React components
│   └── lib/               # Utility functions
├── public/                # Static files
├── tests/                 # E2E tests
├── types/                 # TypeScript types
└── playwright.config.ts   # Playwright configuration
```

## Contributing

1. Fork the repository
2. Create a new branch
3. Make your changes
4. Submit a pull request

## License

MIT License - see LICENSE file for details
