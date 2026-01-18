# Setup Instructions for Rugby Planner

## GitHub Secret Setup (Required for Deployment)

The app needs a GitHub token to save data to the shared Gist. Follow these steps:

### Step 1: Add GitHub Secret

1. Go to your repository: `https://github.com/PrivRBPie/poc_rugby_planner`
2. Click **Settings** (top menu)
3. Click **Secrets and variables** → **Actions** (left sidebar)
4. Click **New repository secret**
5. Add:
   - **Name**: `GIST_TOKEN`
   - **Secret**: `<your GitHub token from .env.local file>`
6. Click **Add secret**

**Note**: Use the token from your `.env.local` file (starts with `ghp_`)

### Step 2: Redeploy

After adding the secret:
1. Go to **Actions** tab
2. Click the latest workflow run
3. Click **Re-run all jobs**

OR just push a new commit:
```bash
git commit --allow-empty -m "Trigger redeploy with token"
git push
```

### Step 3: Verify

1. Wait 2-3 minutes for deployment
2. Open: `https://privrbpie.github.io/poc_rugby_planner/`
3. Make a change
4. Check Gist: `https://gist.github.com/b453bdb17b87d01d506e0ebbb62a5cd3`
5. Should see your change saved!

## Local Development

For local development, the `.env.local` file already has the token configured.

Run locally:
```bash
npm run dev
```

## Security Note

⚠️ **The token will be embedded in the deployed JavaScript bundle**. This is acceptable because:
- The app is for a small private coaching team (not public)
- The token only has access to this one Gist
- The Gist ID is already known/public anyway

For a production public app, you would need a backend API to keep the token secure.
