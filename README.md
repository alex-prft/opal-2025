# My Next.js App

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app), configured with TypeScript, Tailwind CSS, and ESLint.

## Features

- ⚡ Next.js 16 with App Router
- 🎨 Tailwind CSS for styling
- 📝 TypeScript for type safety
- 🧹 ESLint for code linting
- 🚀 Ready for deployment to Vercel

## Getting Started

### Prerequisites

- Node.js 20.9.0 or higher
- npm, yarn, pnpm, or bun

### Development

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Run the development server:

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Deployment Instructions

### GitHub Setup

1. **Authenticate GitHub CLI** (if not already done):
```bash
gh auth login
```

2. **Create GitHub repository and push code**:
```bash
gh repo create my-nextjs-app --public --confirm
git remote add origin https://github.com/YOUR_USERNAME/my-nextjs-app.git
git push -u origin main
```

### Vercel Deployment

1. **Option A: Deploy via Vercel CLI**
   - Install Vercel CLI: `npm i -g vercel`
   - Run: `vercel --prod`
   - Follow the prompts

2. **Option B: Deploy via Vercel Dashboard**
   - Go to [vercel.com](https://vercel.com)
   - Sign in with your GitHub account
   - Click "New Project"
   - Import your GitHub repository
   - Vercel will auto-detect Next.js and deploy

3. **Option C: One-click deploy**
   - Use this button: [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/my-nextjs-app)

## Project Structure

```
my-nextjs-app/
├── src/
│   └── app/
│       ├── globals.css
│       ├── layout.tsx
│       └── page.tsx
├── public/
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── vercel.json
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Vercel Deployment Documentation](https://nextjs.org/docs/app/building-your-application/deploying)
