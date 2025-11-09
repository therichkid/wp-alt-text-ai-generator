# WordPress Alt Text AI Generator

A Node.js tool that automatically generates SEO-friendly and accessible alt text for images in your WordPress media library using Google's Gemini AI.

## Features

- Automatically processes all images in your WordPress media library
- Generates descriptive, SEO-optimized alt text in German using AI
- Skips images that already have alt text
- Includes dry-run mode for testing (doesn't trigger Gemini API calls or update WordPress)

## Prerequisites

- Node.js 23 or higher
- WordPress site with REST API enabled
- WordPress application password for authentication
- Google Cloud Platform account with Gemini API access

## Installation

1. Clone the repository:
```bash
git clone https://github.com/therichkid/wp-alt-text-ai-generator.git
cd wp-alt-text-ai-generator
```

2. Install dependencies:
```bash
pnpm install
```

3. Create a `.env` file in the project root with the following variables:
```env
GEMINI_API_KEY=
WP_BASE_URL=https://www.wordpress.com
WP_USER=
WP_APPLICATION_PASSWORD=
```

## Usage

To run the tool with hot-reload in dry-run mode (doesn't trigger Gemini API calls or update WordPress):
```bash
pnpm run dev
```

To run the tool once and update alt texts with a limit of 10 images:
```bash
pnpm run start
```

## License

ISC

## Author

Richard Zille
