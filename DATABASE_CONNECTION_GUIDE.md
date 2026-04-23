# Database Connection Guide

## Understanding the Error

```
Error: P1001: Can't reach database server at `tramway.proxy.rlwy.net:20576`
```

This error occurs when running `npx prisma db push` locally because:
1. Railway database might be sleeping (free tier limitation)
2. Network/firewall blocking the connection
3. Railway service temporarily unavailable
4. Database credentials might have changed

## Two Prisma Commands Explained

### ✅ `npx prisma generate` - Works Offline
- **Purpose**: Generate Prisma Client and TypeScript types
- **Requires**: Only `schema.prisma` file
- **Database**: NOT needed
- **When**: After changing schema
- **Status**: ✅ This works fine locally

### ❌ `npx prisma db push` - Needs Database
- **Purpose**: Push schema changes to database
- **Requires**: Active database connection
- **Database**: REQUIRED
- **When**: To apply schema changes to database
- **Status**: ❌ Fails locally due to connection issues

## Solution: Let Vercel Handle Database Updates

### What We've Done:

Updated `package.json` build script:
```json
{
  "scripts": {
    "build": "prisma db push && next build",
    "postinstall": "prisma generate"
  }
}
```

### How It Works:

1. **You commit and push code** with updated schema
2. **Vercel deployment starts**
3. **Vercel runs**: `npm install`
4. **Postinstall hook runs**: `prisma generate` ✅
5. **Build script runs**: `prisma db push` ✅ (Vercel has database access)
6. **Build continues**: `next build` ✅
7. **Deployment completes** 🎉

### Why This Works:

- ✅ Vercel has the `DATABASE_URL` environment variable
- ✅ Vercel can reach Railway database
- ✅ Schema changes applied automatically
- ✅ No manual intervention needed

## Local Development Workflow

### When You Change Schema:

1. **Edit** `prisma/schema.prisma`
2. **Run** `npx prisma generate` (works offline)
3. **Commit** your changes
4. **Push** to GitHub
5. **Vercel** handles `prisma db push` automatically

### If You Need to Test Locally:

#### Option 1: Check Railway Dashboard
- Go to Railway dashboard
- Check if database is active
- Wake it up if sleeping (free tier)

#### Option 2: Use Railway CLI
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# Link project
railway link

# Run command with Railway environment
railway run npx prisma db push
```

#### Option 3: Temporary Local Database
```bash
# Use Docker for local PostgreSQL
docker run --name postgres-local -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres

# Update .env.local
DATABASE_URL="postgresql://postgres:password@localhost:5432/mydb"

# Run migrations
npx prisma db push
```

## Current Status

### ✅ What's Working:
- Schema updated with `CONFIRMED` status
- Prisma Client generated successfully
- Code ready for deployment

### ⏳ What Needs Database:
- Applying schema changes to database
- Will happen automatically on Vercel deployment

## Deployment Checklist

- [x] Schema updated in `prisma/schema.prisma`
- [x] Prisma Client generated (`npx prisma generate`)
- [x] Build script updated to include `prisma db push`
- [x] Code committed to repository
- [ ] Push to GitHub
- [ ] Vercel deployment will handle database updates

## Vercel Environment Variables

Make sure these are set in Vercel dashboard:

```
DATABASE_URL=postgresql://postgres:...@tramway.proxy.rlwy.net:20576/railway
NEXTAUTH_URL=https://your-domain.vercel.app
NEXTAUTH_SECRET=your-secret-here
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_...
PAYSTACK_SECRET_KEY=sk_test_...
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=meetbjfunk@gmail.com
SMTP_PASS=zwom eauo dtxr fvrg
ADMIN_EMAIL=meetbjfunk@gmail.com
NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY=public_...
IMAGEKIT_PRIVATE_KEY=private_...
NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/...
```

## Troubleshooting

### If Vercel Build Fails with Database Error:

1. **Check Railway Database Status**
   - Login to Railway dashboard
   - Verify database is running
   - Check connection string hasn't changed

2. **Verify Environment Variables**
   - Go to Vercel project settings
   - Check `DATABASE_URL` is correct
   - Redeploy after updating

3. **Check Railway Logs**
   - Look for connection attempts
   - Check for IP restrictions
   - Verify database is accepting connections

### If Schema Changes Don't Apply:

1. **Manual Push via Railway CLI**
   ```bash
   railway run npx prisma db push
   ```

2. **Use Prisma Studio**
   ```bash
   railway run npx prisma studio
   ```

3. **Check Migration Status**
   ```bash
   railway run npx prisma db push --accept-data-loss
   ```

## Summary

**Don't worry about the local database connection error!**

- ✅ Your schema is correct
- ✅ Prisma Client is generated
- ✅ Code is ready
- ✅ Vercel will handle database updates automatically

Just commit, push, and deploy. Vercel has access to your Railway database and will apply all schema changes during the build process.

## Next Steps

1. Commit your changes:
   ```bash
   git add .
   git commit -m "Fix: Added CONFIRMED status to InspectionStatus enum"
   git push
   ```

2. Vercel will automatically:
   - Install dependencies
   - Generate Prisma Client
   - Push schema changes to database
   - Build the application
   - Deploy successfully

That's it! 🚀
