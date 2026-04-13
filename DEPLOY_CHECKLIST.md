# ShopNext Deployment Checklist

## 1. Create `.env.local`

Copy the example file and fill in real values:

```bash
cp .env.local.example .env.local
```

### Stripe Keys
- Go to https://dashboard.stripe.com/apikeys
- Copy **Publishable key** → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- Copy **Secret key** → `STRIPE_SECRET_KEY`
- (Webhook secret comes from step 3)

### Firebase Service Account
- Go to Firebase Console → Project Settings → Service Accounts
- Click "Generate New Private Key" → downloads a JSON file
- Paste the entire JSON contents into `FIREBASE_SERVICE_ACCOUNT_KEY` (as a single line)
- Or set `GOOGLE_APPLICATION_CREDENTIALS` to the file path instead

### Base URL
- Set `NEXT_PUBLIC_BASE_URL` to your production URL (e.g. `https://shopnext.app`)
- For local dev, leave as `http://localhost:3000`

## 2. Deploy Firebase Security Rules

```bash
firebase deploy --only firestore:rules,storage
```

This deploys the tightened rules that enforce:
- Ownership checks on products/avatars
- Super-admin-only class management
- File type + size limits on storage uploads
- Public read / server-only write on schools collection
- Private subcollection for sensitive credentials

## 3. Set Up Stripe Webhook

- Go to https://dashboard.stripe.com/webhooks
- Click "Add endpoint"
- **Endpoint URL:** `https://your-domain.com/api/stripe-webhook`
- **Events to listen for:**
  - `checkout.session.completed`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_failed`
- After creating, copy the **Signing secret** (starts with `whsec_`)
- Paste it into `.env.local` as `STRIPE_WEBHOOK_SECRET`

## 4. Push and Deploy

```bash
git add -A
git commit -m "Production release"
git push
```

If deploying to Vercel, set the same environment variables in:
Vercel Dashboard → Project → Settings → Environment Variables

## 5. Verify

After deployment, test the full flow:

1. Visit `/register` — fill out school info
2. Pay with Stripe test card (`4242 4242 4242 4242`, any future date, any CVC)
3. Confirm the school was provisioned (check Firestore for `schools` collection)
4. Log in with the credentials shown on the confirmation page
5. Visit `/settings` — verify branding and domain settings work
6. Visit `/admin` — verify the school appears in the real-time dashboard
7. Create a product — verify the spotlight tutorial appears

## Notes

- Existing accounts (e.g. `holscher@shopnext.dev`) continue working without any payment or setup
- Pricing: $20/month per professor license
- Custom domains are included free (Vercel handles DNS, no per-domain cost)
- The Stripe test card above only works in test mode — switch to live keys for production
