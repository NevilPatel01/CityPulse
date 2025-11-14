# Email Configuration for CityPulse

## DigitalOcean Port Restrictions

DigitalOcean blocks the following ports by default to prevent spam:
- Port 25 (SMTP)
- Port 465 (SMTPS)
- Port 587 (Submission)

**Solution**: Use port **2525** with STARTTLS-enabled SMTP providers.

## Recommended SMTP Providers

### Option 1: Gmail with Port 2525 (Current Setup)
**Note**: Gmail doesn't officially support port 2525, so this may not work reliably.

### Option 2: SendGrid (Recommended for Production)
1. Sign up at https://sendgrid.com (Free tier: 100 emails/day)
2. Create an API Key
3. Update `.env`:
```bash
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=2525
EMAIL_SECURE=false
EMAIL_USER=apikey
EMAIL_PASS=your_sendgrid_api_key
```

### Option 3: Mailgun
1. Sign up at https://mailgun.com (Free tier: 5,000 emails/month)
2. Get SMTP credentials
3. Update `.env`:
```bash
EMAIL_HOST=smtp.mailgun.org
EMAIL_PORT=2525
EMAIL_SECURE=false
EMAIL_USER=postmaster@your-domain.mailgun.org
EMAIL_PASS=your_mailgun_password
```

### Option 4: AWS SES
1. Set up AWS SES account
2. Verify your domain
3. Get SMTP credentials
4. Update `.env`:
```bash
EMAIL_HOST=email-smtp.us-east-1.amazonaws.com
EMAIL_PORT=2525
EMAIL_SECURE=false
EMAIL_USER=your_ses_smtp_username
EMAIL_PASS=your_ses_smtp_password
```

## Current Configuration

The email service (`backend/src/services/emailService.ts`) now supports:
- Port 2525 with STARTTLS (requireTLS: true)
- Port 587 with STARTTLS (requireTLS: true)
- Port 465 with SSL/TLS (secure: true)

## Testing Email Configuration

After updating `.env`, restart the backend:

```bash
# On production server
cd /opt/citypulse
docker compose -f docker-compose.prod.yml restart citypulse-backend-prod

# Check logs
docker logs citypulse-backend-prod --tail=50 | grep EMAIL
```

Test password reset:
1. Go to https://city-pulse.app/reset-password
2. Enter your email
3. Check backend logs for email sending status

## Troubleshooting

### Connection Timeout Error
```
Error: Connection timeout
code: 'ETIMEDOUT'
```
**Solution**: The SMTP provider doesn't support the configured port. Switch to a provider that supports port 2525.

### Authentication Failed
```
Error: Invalid login: 535 Authentication failed
```
**Solution**: 
- For Gmail: Use App Password, not regular password
- For other providers: Verify your SMTP credentials

### Port Blocked
```
Error: Connection refused
```
**Solution**: Verify DigitalOcean hasn't blocked the port. Port 2525 should work.

## Production Deployment

1. Update `/opt/citypulse/.env` with correct SMTP settings
2. Restart backend: `docker compose -f docker-compose.prod.yml restart citypulse-backend-prod`
3. Test password reset functionality
4. Monitor logs: `docker logs citypulse-backend-prod --follow`
