This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

La operación de compras con Stripe, historial independiente, reembolsos y disputas
se documenta en [docs/stripe.md](docs/stripe.md) y [docs/support-operations.md](docs/support-operations.md).

La confirmación opcional de asistencia con enlace general, hasta cinco acompañantes
extra y panel privado del organizador se documenta en [docs/rsvp.md](docs/rsvp.md).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Image uploads

Event cover photos, section photos, and gallery images upload through an authenticated server route to Cloudinary. Add these values to `.env`:

```env
CLOUDINARY_CLOUD_NAME="..."
CLOUDINARY_API_KEY="..."
CLOUDINARY_API_SECRET="..."
CLOUDINARY_UPLOAD_PRESET="..."
```

Create a **signed** upload preset in the Cloudinary console and restrict it to JPG, PNG, WebP, and AVIF images with a **5 MB** maximum file size. Disable unsigned upload presets for this application. Keep the API secret server-side; never add it to a `NEXT_PUBLIC_` variable. Each gallery supports up to 12 photos. Uploaded images are delivered with automatic format and quality selection.

Server-enforced budgets, asset tracking, and retryable cleanup require the database migration and scheduler described in [Cloudinary storage](docs/cloudinary-storage.md). Limits are centralized in `lib/limits.ts`: 20 upload attempts/hour and 60/day per account, with 40 retained files and 100 MB per event. Pending uploads and deletions count toward storage until cleanup succeeds.

## Editor recovery

Unpaid drafts autosave after 1.5 seconds. Published invitations keep local changes until the owner explicitly saves. Device backups, creation recovery, conflict detection and verification are described in [Editor protection](docs/editor-protection.md). Apply the editor-version migration before deploying.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
