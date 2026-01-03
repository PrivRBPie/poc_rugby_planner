# Setup Guide: Shared Data with GitHub Gist

This guide will help you set up shared data storage so all users can see the same lineups, schedules, and ratings.

## Quick Setup (5 minutes)

### Step 1: Create a GitHub Personal Access Token

1. Go to https://github.com/settings/tokens
2. Click **"Generate new token"** → **"Generate new token (classic)"**
3. Give it a name like "Rugby Planner"
4. Select scopes: ✅ **gist** (only this one needed)
5. Click **"Generate token"**
6. **COPY THE TOKEN** - you won't see it again! (save it somewhere safe)

### Step 2: Create a GitHub Gist

1. Go to https://gist.github.com/
2. Click **"Create new gist"**
3. Filename: `rugby-data.json`
4. Content:
```json
{
  "playdays": [],
  "lineups": {},
  "ratings": {},
  "training": {},
  "favoritePositions": {},
  "allocationRules": {}
}
```
5. Make it **Public** (so others can read it)
6. Click **"Create public gist"**
7. **COPY THE GIST ID** from the URL (the long string of letters/numbers)
   - Example: If URL is `https://gist.github.com/yourname/abc123def456`
   - The Gist ID is: `abc123def456`

### Step 3: Update Your Code

Open `src/App.jsx` and find these lines (around line 502-503):

```javascript
const GIST_ID = ''; // TODO: Create a Gist and put the ID here
const GITHUB_TOKEN = ''; // TODO: Create a GitHub Personal Access Token
```

Replace them with:

```javascript
const GIST_ID = 'abc123def456'; // YOUR GIST ID HERE
const GITHUB_TOKEN = 'ghp_xxxxxxxxxxxxxxxxxxxx'; // YOUR TOKEN HERE
```

### Step 4: Build and Deploy

```bash
npm run build
git add .
git commit -m "Add shared data storage"
git push
```

## How It Works

- **All users** will now read from and write to the same Gist
- Data syncs automatically whenever someone makes changes
- You'll see a "✓ Synced" indicator in the header
- Fallback to localStorage if Gist is unavailable

## Security Note

⚠️ **Important**: The GitHub token will be visible in your source code. This is OK for a public Gist that anyone can read anyway. The token can only:
- Read/write YOUR gists
- Cannot access your repos or other data

For better security in the future, consider:
- Using environment variables (requires a build step)
- Using a backend service (Firebase, Supabase, etc.)

## Alternative: Simple JSON File

If you don't want to use Gist, you can also:

1. Create a `data.json` file in your `public/` folder
2. Use `fetch('/data.json')` to load it
3. However, this is **read-only** - users can't save changes

This works for viewing but not for collaboration.

## Troubleshooting

**"Not syncing"**
- Check your GIST_ID and GITHUB_TOKEN are correct
- Check browser console for errors
- Make sure the Gist is public

**"Changes not visible to others"**
- Refresh the other user's browser
- Check they're using the same Gist ID

**"Data lost"**
- Data is backed up in localStorage
- You can recover it from there if needed
