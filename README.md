# Upstream Telegram Bot - Feedback System

A monorepo containing a Telegram bot for collecting feedback and a Next.js web app for previewing submissions.

## Project Structure

```
├── packages/
│   └── shared/          # Shared database and S3 services
├── telegram-bot/        # Telegram bot application
└── idea-preview/        # Next.js web app for viewing feedback
```

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL database (Neon recommended)
- AWS S3 bucket for attachments

### Installation

1. Install dependencies:
```bash
npm install
```

2. Build shared package:
```bash
npm run build:shared
```

3. Configure environment variables:

**telegram-bot/.env**
```env
TELEGRAM_BOT_TOKEN=your_bot_token
ADMIN_CHAT_ID=your_chat_id
DATABASE_URL=postgresql://...
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
S3_BUCKET=your_bucket
S3_REGION=your_region
```

**idea-preview/.env.local**
```env
DATABASE_URL=postgresql://...
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
S3_BUCKET=your_bucket
S3_REGION=your_region
```

### Running Applications

**Telegram Bot:**
```bash
npm run dev:bot
```

**Preview Web App:**
```bash
npm run dev:preview
```

### Database Setup

Run migrations from the telegram-bot directory:
```bash
cd telegram-bot
npm run drizzle:push
```

## Features

### Telegram Bot
- Collect feedback from users with multiple types (idea, problem, thanks, question)
- Support for photo attachments
- Anonymous or identified submissions
- Admin notifications with status management

### Preview Web App
- Mobile-first responsive design
- View feedback by ID at `/feedback/[id]`
- Image grid with full-screen preview
- Ukrainian locale support for dates
- Sticky header with navigation

## Tech Stack

- **Shared**: Drizzle ORM, AWS SDK, Neon PostgreSQL
- **Telegram Bot**: Grammy (Telegram bot framework)
- **Web App**: Next.js 16, Tailwind CSS v4, shadcn/ui, TypeScript

## Development

The monorepo uses npm workspaces. Changes to the shared package require rebuilding:

```bash
npm run build:shared
```

## License

ISC

