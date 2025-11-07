# Vercel Deployment Guide

Deploy your Next.js Realtime Demos app to Vercel in just a few minutes!

## Prerequisites

- GitHub account with your repo pushed
- Vercel account (free at [vercel.com](https://vercel.com))
- Your API keys ready (OpenAI, Gemini, AWS)

## Step-by-Step Deployment

### Step 1: Sign Up / Login to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click **Sign Up** (or **Log In** if you have an account)
3. Choose **Sign up with GitHub**
4. Authorize Vercel to access your GitHub account

### Step 2: Create a New Project

1. Click **+ New Project** (or "Add New...")
2. Select **Import Git Repository**
3. Search for your `realtime-demos` repo
4. Click **Import**

### Step 3: Configure Project Settings

1. **Project Name**: `realtime-demos` (or any name you prefer)
2. **Framework Preset**: Should auto-detect as **Next.js** ✅
3. **Build Command**: `npm run build` ✅
4. **Output Directory**: `.next` ✅
5. **Install Command**: `npm install` ✅

### Step 4: Set Environment Variables

**This is critical!** Your API keys must be added here.

1. Scroll to **Environment Variables**
2. Add each variable:

```
OPENAI_API_KEY = sk-your-actual-key-here
GEMINI_API_KEY = your-gemini-key-here
AWS_REGION = us-east-1
AWS_ACCESS_KEY_ID = your-aws-key
AWS_SECRET_ACCESS_KEY = your-aws-secret
```

3. Click **+ Add** for each one
4. Make sure to use the **correct values** from your `.env.local`

⚠️ **Security Note**: These values are encrypted and only accessible by your Vercel deployment. They're not exposed in the browser.

### Step 5: Deploy!

1. Click **Deploy** button
2. Wait for the build to complete (usually 2-3 minutes)
3. You'll see a ✅ when deployment is successful
4. Click the **Visit** button to see your live app!

### Step 6: Get Your Vercel URL

After deployment, you'll have a URL like:
```
https://realtime-demos.vercel.app
```

Your app is now **live on the internet**! 🚀

## Connecting a Custom Domain (Optional)

### Using Cloudflare Domain

1. **In Vercel Dashboard**:
   - Go to your project
   - Settings → Domains
   - Click **Add Domain**
   - Enter: `realtime.yourdomain.com`

2. **In Cloudflare Dashboard**:
   - Go to your domain's DNS settings
   - Add a **CNAME** record:
     - **Name**: `realtime`
     - **Target**: `cname.vercel-dns.com`
     - Click **Save**

3. **Back in Vercel**:
   - Click **Verify** 
   - Wait for DNS propagation (can take a few minutes)
   - Your custom domain is now live! ✅

## Auto-Deployment

**Every time you push to GitHub:**
1. GitHub notifies Vercel
2. Vercel automatically rebuilds and deploys
3. Your changes are live in seconds! 🎉

No more manual deployments needed!

## Testing Your Deployment

1. Open your Vercel URL
2. Click **Connect**
3. Allow microphone access
4. Start chatting!
5. Monitor **Token Usage & Cost** in real-time

## Monitoring & Logs

In Vercel Dashboard:
- **Deployments**: See all deployment history
- **Logs**: Real-time logs from your app
- **Analytics**: Visits, performance metrics
- **Settings**: Manage environment variables, domains

## Updating Environment Variables

If you need to change API keys later:

1. Go to Vercel project **Settings**
2. Click **Environment Variables**
3. Edit or add new variables
4. Vercel automatically redeployes with new vars

## Troubleshooting

### Build Fails
- Check console for error messages
- Ensure all dependencies are in `package.json`
- Run `npm run build` locally to debug

### API Keys Not Working
- Verify keys are added in **Environment Variables**
- Make sure there are no extra spaces: `sk-key` not `sk-key ` (with space)
- Try updating the key and redeploying

### WebSocket Errors
- Vercel fully supports WebSockets ✅
- Check browser console for detailed errors
- Ensure API routes are deployed correctly

### Large Files
- Vercel has a 50MB file limit per deployment
- Check `.gitignore` is excluding large files
- Run `find . -size +10M -type f` to find large files

## Free Tier Limits

Vercel's free tier includes:
- ✅ Unlimited deployments
- ✅ Unlimited bandwidth
- ✅ 12 deployments/month (after that, on-demand)
- ✅ 100GB bandwidth/month
- ✅ Full Next.js support

Perfect for your realtime demos! 🎉

## Next Steps

1. ✅ Deploy to Vercel
2. ✅ Test with your custom domain
3. ✅ Share your live app with others!
4. 📊 Monitor token usage and costs
5. 🔄 Make updates - they auto-deploy

## Support

- Vercel Docs: [vercel.com/docs](https://vercel.com/docs)
- Next.js Docs: [nextjs.org](https://nextjs.org)
- Support: [vercel.com/support](https://vercel.com/support)

---

**Questions?** Let me know! 🚀
