# OTP Integration Guide

## Current Status: Test Mode (No Real OTP)

The application is currently running in **TEST MODE** which bypasses real OTP delivery. This is for development and testing purposes only.

## How Test Mode Works

### Signup Flow (Test Mode)
1. User fills signup form
2. System checks if user exists in profiles table
3. If not, signup succeeds without sending real OTP
4. User is redirected to OTP verification page
5. **Any 6-digit code works** (e.g., 123456)
6. User is created directly in profiles table
7. User is automatically logged in

### Login Flow (Test Mode)
1. User enters email and password
2. System checks profiles table first (test users)
3. If found and password matches, user is logged in
4. If not found, falls back to Supabase auth (real users)

## Test Credentials

### Creating a Test User
Use the signup flow with any credentials:
- **Email**: testuser@example.com
- **Phone**: 9876543210 (will be stored as +919876543210)
- **Password**: testPass123
- **Username**: testuser

### OTP Verification
- **Use any 6-digit code**: 123456, 000000, 999999, etc.
- The system accepts any 6-digit input in test mode

## Real OTP Integration (Production)

To implement real OTP delivery, you need to:

### 1. SMS OTP Service
**Options:**
- Twilio (https://www.twilio.com)
- MSG91 (https://msg91.com)
- Firebase Phone Authentication
- AWS SNS

**Twilio Example:**
```javascript
// Install: npm install twilio
const twilio = require('twilio');
const client = new twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

async function sendSMSOTP(phone, otp) {
  await client.messages.create({
    body: `Your verification code is: ${otp}`,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: phone
  });
}
```

### 2. Email OTP Service
**Options:**
- SendGrid (https://sendgrid.com)
- AWS SES
- Mailgun
- Nodemailer with SMTP

**SendGrid Example:**
```javascript
// Install: npm install @sendgrid/mail
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

async function sendEmailOTP(email, otp) {
  await sgMail.send({
    to: email,
    from: 'noreply@yourdomain.com',
    subject: 'Your Verification Code',
    text: `Your verification code is: ${otp}`
  });
}
```

### 3. Backend API Required
For security, OTP generation and verification should be done on a backend server:

**Required Endpoints:**
- `POST /api/send-otp` - Generate and send OTP
- `POST /api/verify-otp` - Verify OTP and create user

**Example Backend Structure:**
```javascript
// api/send-otp.js
export async function POST(request) {
  const { email, phone } = await request.json();
  
  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000);
  
  // Store OTP in database with expiry (e.g., 5 minutes)
  await db.otp_codes.create({
    email,
    phone,
    code: otp,
    expires_at: new Date(Date.now() + 5 * 60 * 1000)
  });
  
  // Send OTP via SMS/Email
  await sendSMSOTP(phone, otp);
  await sendEmailOTP(email, otp);
  
  return Response.json({ success: true });
}

// api/verify-otp.js
export async function POST(request) {
  const { email, otp, signupData } = await request.json();
  
  // Verify OTP from database
  const storedOTP = await db.otp_codes.find({
    email,
    code: otp,
    expires_at: { gt: new Date() }
  });
  
  if (!storedOTP) {
    return Response.json({ success: false, message: 'Invalid or expired OTP' });
  }
  
  // Create user in Supabase
  const { data, error } = await supabase.auth.signUp({
    email: signupData.email,
    password: signupData.password
  });
  
  // Delete used OTP
  await db.otp_codes.delete({ id: storedOTP.id });
  
  return Response.json({ success: true });
}
```

### 4. Environment Variables Needed
```env
# Twilio
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# SendGrid
SENDGRID_API_KEY=your_sendgrid_key

# Or other service credentials
```

### 5. Security Considerations
- Never store OTPs in client-side code
- Always generate OTPs on server
- Set OTP expiry (5-10 minutes)
- Limit OTP attempts (3-5 tries)
- Use rate limiting to prevent abuse
- Log all OTP attempts for audit

## Switching to Production Mode

To switch from test mode to production:

1. **Remove test mode code** from `AuthContext.jsx`:
   - Remove the test mode checks in `signup()` function
   - Remove the test mode checks in `verifyOTP()` function
   - Remove the test mode checks in `login()` function

2. **Implement backend API** for OTP handling

3. **Update frontend** to call backend API instead of direct Supabase calls

4. **Add environment variables** for OTP service credentials

5. **Test thoroughly** with real OTP delivery before deploying

## Current Test Mode Limitations

- Passwords stored in plain text in profiles table (NOT SECURE)
- No real OTP delivery
- No rate limiting
- No OTP expiry
- Bypasses Supabase authentication

**⚠️ WARNING: Test mode is for development only. Do not use in production.**
