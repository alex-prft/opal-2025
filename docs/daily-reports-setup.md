# Daily Validation Reports Setup Guide

The OPAL Integration Validator can send automated daily reports at **1:30 AM** and **9:30 AM** via email. This guide covers setup and configuration.

## 📅 Schedule Configuration

**Cron Schedule**: Configured in `vercel.json`
- **1:30 AM UTC**: `30 1 * * *` 
- **9:30 AM UTC**: `30 9 * * *`

⚠️ **Important**: Vercel Cron runs in **UTC time**. Adjust for your timezone:
- **EST (UTC-5)**: 1:30 AM UTC = 8:30 PM EST (previous day), 9:30 AM UTC = 4:30 AM EST
- **PST (UTC-8)**: 1:30 AM UTC = 5:30 PM PST (previous day), 9:30 AM UTC = 1:30 AM PST
- **CET (UTC+1)**: 1:30 AM UTC = 2:30 AM CET, 9:30 AM UTC = 10:30 AM CET

## 🔧 Environment Variables

### Required Variables
```bash
# Cron Security
CRON_SECRET="your-secure-random-string-here"

# Email Recipients (comma-separated)
REPORT_EMAIL_RECIPIENTS="admin@company.com,devops@company.com"

# Email From Address
REPORT_EMAIL_FROM="noreply@company.com"
```

### Email Provider Configuration

#### Option 1: Resend (Recommended)
```bash
EMAIL_PROVIDER="resend"
EMAIL_API_KEY="re_your_resend_api_key"
```

#### Option 2: SendGrid
```bash
EMAIL_PROVIDER="sendgrid"
EMAIL_API_KEY="SG.your_sendgrid_api_key"
```

#### Option 3: SMTP (Nodemailer)
```bash
EMAIL_PROVIDER="nodemailer"
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
```

#### Option 4: Webhook (Custom Integration)
```bash
EMAIL_PROVIDER="webhook"
REPORT_WEBHOOK_URL="https://your-webhook-endpoint.com/daily-reports"
```

## 🚀 Deployment Setup

### 1. Vercel Environment Variables
```bash
# Add environment variables in Vercel dashboard or via CLI
vercel env add CRON_SECRET
vercel env add REPORT_EMAIL_RECIPIENTS
vercel env add REPORT_EMAIL_FROM
vercel env add EMAIL_PROVIDER
vercel env add EMAIL_API_KEY  # or SMTP settings
```

### 2. Deploy with Cron Configuration
```bash
# Deploy with vercel.json configuration
vercel --prod
```

### 3. Verify Cron Jobs
```bash
# Check Vercel dashboard > Functions > Cron Jobs
# Should show two scheduled functions at 1:30 AM and 9:30 AM UTC
```

## 📧 Email Service Setup

### Resend Setup (Recommended)
1. Sign up at [resend.com](https://resend.com)
2. Create API key
3. Verify your domain
4. Add `EMAIL_PROVIDER="resend"` and `EMAIL_API_KEY="your_key"`

### SendGrid Setup
1. Sign up at [sendgrid.com](https://sendgrid.com)
2. Create API key with Mail Send permissions
3. Verify sender identity
4. Add `EMAIL_PROVIDER="sendgrid"` and `EMAIL_API_KEY="your_key"`

### Gmail SMTP Setup
1. Enable 2FA on your Google account
2. Create App Password: Account > Security > App passwords
3. Use App Password (not regular password) for `SMTP_PASS`

## 📊 Report Content

Each daily report includes:

### Summary Statistics
- Total validations in last 24 hours
- Success rate with trend analysis
- Breakdown: successful, warnings, failures
- Average validation duration

### Trend Analysis
- Success rate comparison with previous 24 hours
- Validation volume changes
- Performance insights

### Failed Validations
- Up to 10 most recent failures
- Workflow IDs and correlation IDs
- Failure summaries and affected layers
- Timestamps for each failure

### Health Status
- 🟢 **Excellent**: 95%+ success rate
- 🟡 **Good**: 80-94% success rate  
- 🟠 **Warning**: 60-79% success rate
- 🔴 **Critical**: <60% success rate

## 🧪 Testing Configuration

### Test Email Configuration
```bash
# Use the test endpoint to verify email setup
curl -X POST "https://your-domain.vercel.app/api/admin/osa/monitoring" \
  -H "Content-Type: application/json" \
  -d '{"action": "test_email"}'
```

### Manual Report Generation
```bash
# Trigger manual report (requires CRON_SECRET)
curl -X GET "https://your-domain.vercel.app/api/cron/daily-validation-report" \
  -H "Authorization: Bearer your-cron-secret"
```

### Local Testing
```bash
# Set environment variables
export CRON_SECRET="test-secret"
export REPORT_EMAIL_RECIPIENTS="test@example.com"
export EMAIL_PROVIDER="webhook"
export REPORT_WEBHOOK_URL="https://webhook.site/your-unique-id"

# Start local server
npm run dev

# Test endpoint
curl -X GET "http://localhost:3000/api/cron/daily-validation-report" \
  -H "Authorization: Bearer test-secret"
```

## 🔍 Monitoring & Troubleshooting

### Check Cron Execution
- **Vercel Dashboard**: Functions > Cron > View logs
- **Server Logs**: Check for `[Daily Report Cron]` messages

### Common Issues

#### 1. Cron Not Running
- Verify `vercel.json` is in project root
- Check Vercel deployment includes cron configuration
- Ensure CRON_SECRET is set in Vercel environment

#### 2. Email Not Sending
- Test email configuration with test endpoint
- Check API key permissions (Send Mail)
- Verify sender domain is verified
- Check recipient addresses are valid

#### 3. Missing Data
- Ensure database tables exist (`opal_integration_validation`)
- Check API endpoint `/api/admin/osa/integration-status` works
- Verify validation records are being created

#### 4. Wrong Timezone
- Remember Vercel Cron runs in UTC
- Calculate your local timezone offset
- Update cron schedule in `vercel.json` if needed

### Debug Commands
```bash
# Check database tables
curl "https://your-domain.vercel.app/api/admin/osa/integration-status?limit=5"

# Test monitoring system
curl "https://your-domain.vercel.app/api/admin/osa/monitoring?action=status"

# View cron logs
vercel logs --follow
```

## 🔧 Customization

### Modify Report Schedule
Edit `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/daily-validation-report",
      "schedule": "0 8 * * *"  // 8:00 AM UTC
    }
  ]
}
```

### Customize Report Content
Modify functions in `src/app/api/cron/daily-validation-report/route.ts`:
- `generateEmailHTML()` - HTML email template
- `generateEmailText()` - Plain text version
- `generateDailyReport()` - Data collection logic
- `calculateValidationStats()` - Statistics calculation

### Add Additional Recipients
```bash
# Environment variable (comma-separated)
REPORT_EMAIL_RECIPIENTS="admin@company.com,devops@company.com,managers@company.com"
```

## 📈 Success Indicators

✅ **Cron Jobs Listed**: Visible in Vercel dashboard
✅ **Email Test Passes**: Test endpoint returns success
✅ **Reports Delivered**: Emails arrive at scheduled times
✅ **Data Present**: Reports contain recent validation data
✅ **Links Working**: Dashboard links in email are accessible

## 🔒 Security Notes

- Keep `CRON_SECRET` secure and unique
- Use environment variables for all sensitive data
- API keys should have minimal required permissions
- Regularly rotate SMTP passwords and API keys
- Monitor email delivery logs for suspicious activity

---

**Support**: For issues, check the Vercel function logs and test email configuration endpoints. The monitoring dashboard at `/admin/integration-dashboard` provides real-time status information.