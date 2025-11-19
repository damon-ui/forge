# FORGE Setup Instructions

**Getting FORGE into GitHub When It's Back Online**

---

## 🎯 You Are Here

You have:
- ✅ Created GitHub repo: `damon-ui/forge`
- ✅ Created local folder: `~/Documents/forge/`
- ✅ Downloaded the `forge-v3.0-package/` folder
- ❌ GitHub is having 500 errors (not your fault!)

---

## 🚀 When GitHub Comes Back Online

### Step 1: Copy Files to Local Repo

```bash
# Go to your local forge folder
cd ~/Documents/forge

# Copy everything from the package
cp -R ~/Downloads/forge-v3.0-package/* .

# Verify
ls -la
```

You should see:
```
README.md
v3.0/
  ├── core/
  │   └── forge-utils.js
  ├── tools/
  ├── tests/
  └── docs/
```

---

### Step 2: Initialize Git (If Not Already Done)

```bash
cd ~/Documents/forge
git init
git branch -M main
```

---

### Step 3: Connect to GitHub

```bash
git remote add origin https://github.com/damon-ui/forge.git
git remote -v
```

Should show:
```
origin  https://github.com/damon-ui/forge.git (fetch)
origin  https://github.com/damon-ui/forge.git (push)
```

---

### Step 4: Commit Everything

```bash
# Add all files
git add .

# Commit with message
git commit -m "🔥 FORGE v3.0 - Initial foundation build

- Complete utility library (forge-utils.js)
- Unified JSON format specification
- Test suite with 100% pass rate
- Documentation and examples
- Clean architecture for future tools"

# Verify commit
git log
```

---

### Step 5: Push to GitHub

```bash
git push -u origin main
```

If it asks for authentication, you might need to:

**Option A: Use Personal Access Token**
1. Go to https://github.com/settings/tokens
2. Generate new token (classic)
3. Give it `repo` permissions
4. Copy the token
5. Use as password when prompted

**Option B: Set Up SSH Keys**
1. Generate key: `ssh-keygen -t ed25519 -C "your@email.com"`
2. Add to SSH agent: `ssh-add ~/.ssh/id_ed25519`
3. Copy public key: `cat ~/.ssh/id_ed25519.pub`
4. Add to GitHub: Settings → SSH Keys → New
5. Change remote to SSH: `git remote set-url origin git@github.com:damon-ui/forge.git`

---

### Step 6: Verify on GitHub

Go to: https://github.com/damon-ui/forge

You should see:
- ✅ README.md with FORGE branding
- ✅ v3.0/ folder
- ✅ All files uploaded

---

## 🔗 Get Your CDN Link

Once pushed, you can use:

```html
<script src="https://cdn.jsdelivr.net/gh/damon-ui/forge@main/v3.0/core/forge-utils.js"></script>
```

**Note:** jsDelivr can take 10-15 minutes to cache new files. Test with raw GitHub URL first:

```html
<script src="https://raw.githubusercontent.com/damon-ui/forge/main/v3.0/core/forge-utils.js"></script>
```

---

## 🧪 Test It Works

Create a test HTML file:

```html
<!DOCTYPE html>
<html>
<head>
  <title>FORGE Test</title>
</head>
<body>
  <h1>Testing FORGE Utils</h1>
  <div id="result"></div>

  <script src="https://cdn.jsdelivr.net/gh/damon-ui/forge@main/v3.0/core/forge-utils.js"></script>
  <script>
    // Test date formatting
    const date = ForgeUtils.Date.formatDate('2026-06-15');
    
    // Test price formatting
    const price = ForgeUtils.Price.formatPrice(13594);
    
    // Display results
    document.getElementById('result').innerHTML = `
      <p>Date: ${date}</p>
      <p>Price: ${price}</p>
      <p>✅ FORGE is working!</p>
    `;
  </script>
</body>
</html>
```

---

## 📝 Alternative: Upload via GitHub Web

If git commands still don't work, you can upload files through the web interface:

1. Go to https://github.com/damon-ui/forge
2. Click "Add file" → "Upload files"
3. Drag the entire `v3.0/` folder
4. Drag `README.md`
5. Add commit message
6. Click "Commit changes"

**Note:** This works but you lose git history. Better to use command line when possible.

---

## 🎯 When It's All Set Up

You'll be able to:

1. **Reference FORGE in all tools**
   ```html
   <script src="https://cdn.jsdelivr.net/gh/damon-ui/forge@main/v3.0/core/forge-utils.js"></script>
   ```

2. **Update once, all tools benefit**
   - Edit `forge-utils.js`
   - Commit and push
   - All tools automatically get the update

3. **Version control everything**
   - See history of all changes
   - Roll back if needed
   - Branch for experiments

---

## 🚨 Troubleshooting

### "Authentication failed"
- Use Personal Access Token as password
- OR set up SSH keys

### "Permission denied"
- Make sure you're logged into correct GitHub account
- Verify repo is `damon-ui/forge`

### "Push rejected"
- Try: `git pull origin main --rebase`
- Then: `git push -u origin main`

### Files not showing on jsDelivr
- Wait 10-15 minutes for cache
- Use raw GitHub URL in the meantime
- Clear browser cache

---

## 📞 Need Help?

If GitHub is still having issues:
1. Check https://www.githubstatus.com
2. Try again in an hour
3. Everything is saved locally - no work lost!

---

**🔥 FORGE v3.0 - Ready to Deploy!**
