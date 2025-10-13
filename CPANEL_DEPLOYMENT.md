# cPanel Deployment Guide - Easyread IQ

This guide walks you through deploying the Easyread IQ application on cPanel hosting with the domain **iq.easyread.ng**.

## Prerequisites

- cPanel hosting account with Node.js support (Node.js 18+ recommended)
- Supabase PostgreSQL database (already configured)
- Twilio account with credentials
- Paystack account with API keys
- SSH/Terminal access to cPanel

## 1. Environment Variables

Set these environment variables in your cPanel Node.js application settings or `.env` file:

### Required Environment Variables

```bash
# Application Configuration
NODE_ENV=production
PORT=5000
APP_URL=https://iq.easyread.ng

# Database (Supabase - Keep existing connection)
DATABASE_URL=your_supabase_connection_string

# Twilio Configuration (Direct SDK - REQUIRED)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number

# Twilio WhatsApp (Optional - for WhatsApp OTP)
TWILIO_WHATSAPP_NUMBER=+15558448353
TWILIO_WHATSAPP_TEMPLATE_SID=HX744f249ec6fb5f7c9bd1da007ddac492

# Paystack Payment Gateway
PAYSTACK_SECRET_KEY=your_paystack_secret_key
```

### How to Get Twilio Credentials

1. Log in to your [Twilio Console](https://console.twilio.com/)
2. **Account SID** and **Auth Token** are on your dashboard
3. **Phone Number**: Go to Phone Numbers → Manage → Active Numbers
4. Copy these values to your environment variables

### Environment Variables Removed (Replit-specific)

These are NO LONGER needed:
- ~~REPLIT_CONNECTORS_HOSTNAME~~
- ~~REPL_IDENTITY~~
- ~~WEB_REPL_RENEWAL~~
- ~~REPLIT_DOMAINS~~
- ~~REPLIT_DEV_DOMAIN~~
- ~~REPL_ID~~

## 2. Build the Application

Before deploying to cPanel, build the application locally or on your server:

```bash
# Install dependencies
npm install

# Build the frontend
npm run build
```

This creates a production-ready build in the `dist/public` directory.

## 3. Upload Files to cPanel

### Option A: Using File Manager
1. Log in to cPanel → File Manager
2. Navigate to your domain directory (e.g., `public_html/iq`)
3. Upload all files EXCEPT:
   - `node_modules/` (will be installed on server)
   - `.git/` (not needed in production)
   - `.env` (configure separately in cPanel)

### Option B: Using Git Deployment
1. Set up Git Version Control in cPanel
2. Connect to your GitHub/GitLab repository
3. Deploy the branch

### Option C: Using SSH/SCP
```bash
# From your local machine
scp -r ./dist ./server ./shared ./package.json ./package-lock.json user@your-server:/path/to/app
```

## 4. Install Dependencies on Server

SSH into your cPanel server and run:

```bash
cd /path/to/your/app
npm install --production
```

## 5. Configure Node.js Application in cPanel

1. **Go to**: cPanel → Setup Node.js App
2. **Create Application**:
   - **Node.js version**: 18.x or higher
   - **Application mode**: Production
   - **Application root**: Path to your app (e.g., `iq.easyread.ng`)
   - **Application URL**: iq.easyread.ng
   - **Application startup file**: `dist/index.js`
   - **Environment variables**: Add all variables from step 1

3. **Click**: Create

## 6. Set Environment Variables in cPanel

In the Node.js App interface:
1. Click "Edit" on your application
2. Scroll to "Environment variables"
3. Add each variable from the list in Step 1
4. Click "Save"

## 7. Start the Application

```bash
# In cPanel Node.js App interface, click:
[RESTART]

# Or via SSH:
npm start
```

## 8. Verify Deployment

### Check Application Status
1. Visit: https://iq.easyread.ng
2. You should see the Easyread IQ landing page

### Test Authentication
1. Click "Get Started Free" or "Login"
2. Enter a phone number with country code
3. Verify OTP is sent via WhatsApp/SMS
4. Complete login process

### Test Payments
1. Log in as a user
2. Click "Get Premium Access"
3. Verify Paystack payment page loads with correct callback URL
4. Complete a test payment

## 9. Database Migration (if needed)

If you need to sync database schema changes:

```bash
# SSH into server
cd /path/to/your/app

# Run database push
npm run db:push

# Or force push if there are warnings
npm run db:push -- --force
```

## 10. Troubleshooting

### Application Won't Start
- **Check logs**: cPanel → Node.js App → View error log
- **Verify environment variables** are set correctly
- **Check Node.js version** (should be 18+)

### Twilio OTP Not Sending
- Verify `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `TWILIO_PHONE_NUMBER` are correct
- Check Twilio Console for error logs
- Ensure phone numbers include country code (e.g., +234...)

### Paystack Callback Not Working
- Verify `APP_URL=https://iq.easyread.ng` is set
- Check Paystack dashboard → Settings → Callback URL
- Ensure domain is accessible (no firewall blocking)

### Database Connection Issues
- Verify `DATABASE_URL` is correct
- Check Supabase connection pooling settings
- Ensure SSL is enabled in connection string

### Build Errors
```bash
# Clear cache and rebuild
rm -rf node_modules dist
npm install
npm run build
```

## 11. Performance Optimization

### Enable Caching
Add to `.htaccess` in your domain root:

```apache
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/jpg "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/webp "access plus 1 year"
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
</IfModule>
```

### Use PM2 for Process Management (Optional)
```bash
# Install PM2 globally
npm install -g pm2

# Start app with PM2
pm2 start dist/index.js --name easyread-iq

# Auto-restart on reboot
pm2 startup
pm2 save
```

## 12. Monitoring and Logs

### View Application Logs
```bash
# In cPanel
Node.js App → [Your App] → View error log

# Or via SSH
tail -f /path/to/logs/error.log
```

### Monitor Application
```bash
# With PM2
pm2 monit

# Or check status
pm2 status
```

## 13. Updating the Application

When you need to deploy updates:

```bash
# 1. Pull latest code (if using Git)
git pull origin main

# 2. Install new dependencies
npm install --production

# 3. Rebuild frontend
npm run build

# 4. Restart application
# In cPanel: Node.js App → Restart
# Or with PM2:
pm2 restart easyread-iq
```

## 14. SSL Certificate

Ensure your domain has an SSL certificate:
1. cPanel → SSL/TLS Status
2. Run AutoSSL for iq.easyread.ng
3. Verify HTTPS is working: https://iq.easyread.ng

## 15. Backup Strategy

### Regular Backups
1. **Database**: Supabase handles automatic backups
2. **Files**: Use cPanel Backup tool weekly
3. **Environment Variables**: Keep a secure copy of `.env`

### Before Major Updates
```bash
# Backup database
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Backup files
tar -czf app_backup_$(date +%Y%m%d).tar.gz /path/to/app
```

## Summary

Your Easyread IQ application is now running on cPanel with:
- ✅ Direct Twilio integration (no Replit Connector)
- ✅ Custom domain: https://iq.easyread.ng
- ✅ Paystack payments with correct callback URL
- ✅ Supabase PostgreSQL database
- ✅ Production-ready configuration

## Support

For issues or questions:
1. Check error logs in cPanel
2. Review Twilio/Paystack dashboards
3. Verify all environment variables are set
4. Test in local development first

---

**Deployment completed!** 🎉 Your app is live at https://iq.easyread.ng
