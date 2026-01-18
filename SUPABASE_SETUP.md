# Supabase Setup Instructions

## ✅ What You've Done So Far
1. Created Supabase account
2. Created project: `mgxpsexuetejfhbqmjdx`
3. Got credentials (URL and anon key)

## 📋 Next Steps

### Step 1: Run the Database Schema

1. Go to your Supabase project: https://supabase.com/dashboard/project/mgxpsexuetejfhbqmjdx
2. Click **SQL Editor** (lightning bolt icon on left sidebar)
3. Click **New query**
4. Copy the entire contents of `supabase-schema.sql` from this repository
5. Paste into the SQL editor
6. Click **Run** (or press Ctrl+Enter)
7. You should see: **"Rugby Planner schema created successfully!"**

### Step 2: Add GitHub Secret for Deployment

1. Go to: https://github.com/PrivRBPie/poc_rugby_planner/settings/secrets/actions
2. Click **"New repository secret"**
3. Add:
   - **Name**: `SUPABASE_ANON_KEY`
   - **Secret**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1neHBzZXh1ZXRlamZoYnFtamR4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3NDgwMDYsImV4cCI6MjA4NDMyNDAwNn0.eSgCi5_pPZhCEaYeN9rdpDpaW0vcJbv74w7Zb-JVvKM`
4. Click **"Add secret"**

### Step 3: Deploy

The code is already pushed. Now trigger a deployment:

```bash
cd C:\Users\Paul\Documents\GitHub\poc_rugby_planner
git commit --allow-empty -m "Trigger Supabase deployment"
git push
```

OR manually re-run the workflow:
1. Go to: https://github.com/PrivRBPie/poc_rugby_planner/actions
2. Click the latest workflow
3. Click **"Re-run all jobs"**

### Step 4: Test!

**Local Testing (recommended first):**
```bash
npm run dev
```
- Open http://localhost:5173
- Make a change (edit a rating)
- Open another browser tab to http://localhost:5173
- Changes should appear **instantly** in the second tab! ⚡

**Production Testing:**
1. Wait 2-3 minutes for GitHub Actions to deploy
2. Open: https://privrbpie.github.io/poc_rugby_planner/
3. Open the same URL in a different browser/incognito
4. Make changes in one browser
5. Watch them appear **instantly** in the other! 🎉

---

## 🎯 What You Get with Supabase

### Real-Time Sync
- Changes appear **instantly** across all browsers (no 30-second delay!)
- No manual refresh button needed
- Automatic conflict resolution

### Secure & Scalable
- Anon key is safe to expose (Row Level Security policies control access)
- Free tier: 500MB database, 50K monthly active users
- PostgreSQL backend = production-grade

### Future Possibilities
Now that you have a real database, you can easily add:
- Historical reports ("Show all lineups from December")
- Player statistics ("How many times did each player play position X?")
- Performance tracking over time
- Export to CSV/PDF
- Multiple teams/age groups

---

## 🔧 Troubleshooting

**"Error loading from Supabase"**
- Check that you ran the SQL schema (Step 1)
- Check browser console (F12) for specific errors

**"No real-time updates"**
- Check that the SQL schema included `ALTER PUBLICATION supabase_realtime ADD TABLE rugby_data`
- Refresh both browsers

**Changes not persisting**
- Check Supabase dashboard → Table Editor → rugby_data
- Should see one row with your data in the `data` JSONB column

**Deployment failing**
- Make sure SUPABASE_ANON_KEY secret is added correctly
- Check GitHub Actions logs for specific errors

---

## 📊 Viewing Your Data

You can inspect the database directly:
1. Go to: https://supabase.com/dashboard/project/mgxpsexuetejfhbqmjdx/editor
2. Click **Table Editor** (left sidebar)
3. Click **rugby_data** table
4. See your data stored as JSON!

---

Need help? Check the GitHub Actions logs or browser console for errors!
