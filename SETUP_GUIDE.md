# 🚀 Setup Guide - Construction Expense Tracker

## 📋 Table of Contents
1. [Local Development Setup](#local-development-setup)
2. [Firebase Setup (Optional)](#firebase-setup-optional)
3. [GitHub Pages Deployment](#github-pages-deployment)
4. [Mobile PWA Installation](#mobile-pwa-installation)
5. [Troubleshooting](#troubleshooting)

---

## 🖥️ Local Development Setup

### Step 1: Install Dependencies
```bash
cd construction-tracking
npm install
```

### Step 2: Start Development Server
```bash
npm start
```

The app will automatically open at `http://localhost:3000`

### What You Get Immediately:
✅ Full working application  
✅ All features available  
✅ Data stored locally in browser  
✅ Works offline after first load  
✅ No internet connection needed  

---

## ☁️ Firebase Setup (Optional - for Cloud Sync)

Firebase enables real-time sync across devices. **100% FREE for personal use!**

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Add Project"
3. Enter project name: "Construction Tracker"
4. Disable Google Analytics (optional)
5. Click "Create Project"

### Step 2: Enable Firestore Database

1. In Firebase Console, click "Firestore Database"
2. Click "Create database"
3. Choose "Start in **test mode**" (for now)
4. Select a location (closest to you)
5. Click "Enable"

### Step 3: Enable Storage

1. Click "Storage" in left sidebar
2. Click "Get Started"
3. Use default rules
4. Click "Done"

### Step 4: Get Configuration

1. Click the ⚙️ icon → "Project settings"
2. Scroll to "Your apps" → Click web icon `</>`
3. Register app name: "Construction Tracker Web"
4. Copy the `firebaseConfig` object

### Step 5: Update Application

Open `src/services/firebase.js` and replace:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",              // Replace with your values
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

### Step 6: Update Security Rules (Important!)

In Firebase Console → Firestore Database → Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      // For personal use only
      allow read, write: if true;
      
      // For better security, you can restrict by date:
      // allow read, write: if request.time < timestamp.date(2027, 12, 31);
    }
  }
}
```

Click "Publish"

### Free Tier Limits (More than enough!):
- 1 GB stored data
- 50,000 document reads per day
- 20,000 document writes per day
- 20,000 document deletes per day

For 1000 construction expenses, you'll use less than 1% of the free tier!

---

## 🌐 GitHub Pages Deployment

Deploy your app for free on GitHub Pages - access from anywhere!

### Prerequisites:
- GitHub account (free)
- Git installed on your computer

### Step 1: Update package.json

Open `package.json` and change the homepage:

```json
"homepage": "https://YOUR_GITHUB_USERNAME.github.io/construction-tracking",
```

Replace `YOUR_GITHUB_USERNAME` with your actual GitHub username.

### Step 2: Create GitHub Repository

1. Go to [GitHub](https://github.com) → Click "New repository"
2. Repository name: `construction-tracking`
3. Keep it Public
4. Don't initialize with README (we already have one)
5. Click "Create repository"

### Step 3: Push Code to GitHub

```bash
# Navigate to project folder
cd construction-tracking

# Initialize git (if not done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - Construction Expense Tracker"

# Add remote (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/construction-tracking.git

# Push to GitHub
git branch -M main
git push -u origin main
```

### Step 4: Deploy to GitHub Pages

```bash
npm run deploy
```

**That's it!** Your app is now live at:  
`https://YOUR_USERNAME.github.io/construction-tracking`

### Updating Your Deployed App:

Whenever you make changes:

```bash
git add .
git commit -m "Your update message"
git push
npm run deploy
```

---

## 📱 Mobile PWA Installation

### For Android (Chrome):

#### Method 1: Automatic Prompt
1. Open the deployed URL on your Android phone
2. Chrome will show "Add Construction Tracker to Home screen" banner
3. Tap "Add"
4. App installed!

#### Method 2: Manual Installation
1. Open the deployed URL in Chrome
2. Tap the menu icon (⋮) in the top-right
3. Tap "Add to Home screen"
4. Customize name if desired
5. Tap "Add"
6. Icon appears on your home screen

### Features After Installation:
✅ Full-screen app (no browser bars)  
✅ Appears in app drawer  
✅ Works offline  
✅ Splash screen on launch  
✅ Feels like a native app  

### For iPhone (Safari):

1. Open URL in Safari
2. Tap the Share button (square with arrow)
3. Scroll and tap "Add to Home Screen"
4. Tap "Add"

Note: iOS has limited PWA support compared to Android.

---

## 🔧 Troubleshooting

### Build Errors

**Error: `npm install` fails**
```bash
# Clear cache and retry
npm cache clean --force
npm install
```

**Error: Port 3000 already in use**
```bash
# Option 1: Kill existing process
# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID_NUMBER> /F

# Option 2: Use different port
set PORT=3001 && npm start
```

### Firebase Issues

**Error: Permission denied**
- Check Firestore security rules
- Make sure rules allow read/write
- Rules should be in "test mode" for personal use

**Error: Firebase not initializing**
- Verify all config values are correct
- Check browser console for specific error
- Ensure Firebase project is active

### GitHub Pages Issues

**Error: Page not found (404)**
- Wait 5-10 minutes after first deployment
- Check repository settings → Pages
- Ensure source is set to `gh-pages` branch

**Error: App loads but blank screen**
- Check `homepage` in package.json matches your URL
- Verify basename in `App.js` matches repo name
- Clear browser cache and hard reload (Ctrl+Shift+R)

### PWA Installation Issues

**"Add to Home Screen" not showing**
- Ensure you're using HTTPS (required for PWA)
- GitHub Pages provides HTTPS automatically
- Check manifest.json is accessible
- Try Chrome on Android for best support

**Offline mode not working**
- Service worker needs HTTPS to work
- Works on localhost or GitHub Pages
- Check browser supports service workers

### Data Issues

**Data disappeared**
- Check browser localStorage wasn't cleared
- Export to Excel regularly as backup
- Consider enabling Firebase sync

**Cannot import Excel file**
- Ensure file is .xlsx format
- Check file has "Expenses" sheet
- Verify required columns exist (Date, Category, Amount)

### Performance Issues

**App loading slowly**
- Clear browser cache
- Check internet connection (if using Firebase)
- Large dataset? Try filtering date ranges

**Charts not rendering**
- Ensure you have expense data
- Check browser console for errors
- Try different browser

---

## 📊 Usage Tips

### Best Practices:

1. **Regular Backups**
   - Export to Excel weekly
   - Keep Excel files in cloud storage (Dropbox/Google Drive)

2. **Mobile Usage**
   - Install PWA for quick access at construction site
   - Add expenses offline, they save locally
   - Sync when you have internet (if using Firebase)

3. **Organization**
   - Customize categories to match your project
   - Add vendor contact info for quick reference
   - Use sub-categories for better tracking

4. **Budget Tracking**
   - Set category budgets in Settings
   - Monitor dashboard regularly
   - Export monthly reports

---

## 🆘 Still Need Help?

### Check:
1. Browser console (F12) for error messages
2. Network tab to see failed requests
3. Application tab to check localStorage data

### Resources:
- [React Documentation](https://react.dev)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Material-UI Documentation](https://mui.com)
- [GitHub Pages Guide](https://pages.github.com)

---

## ✅ Quick Checklist

### For Local Development:
- [ ] Node.js installed
- [ ] Dependencies installed (`npm install`)
- [ ] App starts successfully (`npm start`)
- [ ] No console errors

### For Firebase (Optional):
- [ ] Firebase project created
- [ ] Firestore enabled
- [ ] Storage enabled
- [ ] Config updated in `firebase.js`
- [ ] Security rules published

### For Deployment:
- [ ] GitHub repository created
- [ ] `homepage` in package.json updated
- [ ] Code pushed to GitHub
- [ ] `npm run deploy` executed successfully
- [ ] Live URL accessible

### For Mobile:
- [ ] Deployed to GitHub Pages (HTTPS required)
- [ ] Tested on mobile browser
- [ ] PWA installed successfully
- [ ] Offline mode working

---

**🎉 Congratulations! You're all set up!**

Start tracking your construction expenses like a pro! 🏗️
