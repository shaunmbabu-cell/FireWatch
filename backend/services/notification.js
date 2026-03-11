const nodemailer = require('nodemailer');

// Email transporter configuration
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Send email notification
const sendEmail = async (to, subject, html) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject,
      html
    };

    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully to:', to);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

// Send SMS notification (using Twilio or similar service)
const sendSMS = async (to, message) => {
  try {
    // Check if Twilio is configured
    if (!process.env.SMS_ACCOUNT_SID || !process.env.SMS_AUTH_TOKEN || !process.env.SMS_PHONE_NUMBER) {
      console.log('SMS not configured. Would send to:', to, 'Message:', message);
      return false;
    }

    const accountSid = process.env.SMS_ACCOUNT_SID;
    const authToken = process.env.SMS_AUTH_TOKEN;
    const client = require('twilio')(accountSid, authToken);
    
    await client.messages.create({
      body: message,
      from: process.env.SMS_PHONE_NUMBER,
      to: to
    });
    
    console.log('✅ SMS sent successfully to:', to);
    return true;
  } catch (error) {
    console.error('❌ Error sending SMS:', error.message);
    return false;
  }
};

// Send fire incident alert to responders
const sendFireAlert = async (incident, responders) => {
  const subject = `🚨 NEW FIRE INCIDENT - ${incident.fireSize.toUpperCase()} ${incident.fireType}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #d32f2f; color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0;">🚨 FIRE INCIDENT ALERT</h1>
      </div>
      <div style="padding: 20px; background: #f5f5f5;">
        <h2 style="color: #d32f2f;">Incident Details</h2>
        <p><strong>Type:</strong> ${incident.fireType}</p>
        <p><strong>Size:</strong> ${incident.fireSize}</p>
        <p><strong>Priority:</strong> ${incident.priority}</p>
        <p><strong>Location:</strong> ${incident.location.address}</p>
        <p><strong>Description:</strong> ${incident.description}</p>
        <p><strong>Coordinates:</strong> ${incident.location.coordinates[1]}, ${incident.location.coordinates[0]}</p>
        ${incident.contactInfo.phone ? `<p><strong>Contact:</strong> ${incident.contactInfo.name} - ${incident.contactInfo.phone}</p>` : ''}
        <p><strong>Reported:</strong> ${new Date(incident.createdAt).toLocaleString()}</p>
        <div style="margin-top: 20px; text-align: center;">
          <a href="${process.env.FRONTEND_URL}/dashboard/incidents/${incident._id}" 
             style="background: #d32f2f; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
            View in Dashboard
          </a>
        </div>
      </div>
    </div>
  `;

  // Send to all responders
  for (const responder of responders) {
    if (responder.email) {
      await sendEmail(responder.email, subject, html);
    }
    if (responder.phone) {
      const smsMessage = `FIRE ALERT: ${incident.fireSize} ${incident.fireType} at ${incident.location.address}. Login to dashboard for details.`;
      await sendSMS(responder.phone, smsMessage);
    }
  }
};

// Send status update notification
const sendStatusUpdate = async (incident, user) => {
  if (!user.email) return;

  const subject = `Fire Incident Status Update - ${incident.status}`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #1976d2; color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0;">Status Update</h1>
      </div>
      <div style="padding: 20px; background: #f5f5f5;">
        <p>The fire incident at <strong>${incident.location.address}</strong> has been updated to:</p>
        <div style="background: white; padding: 15px; border-left: 4px solid #1976d2; margin: 20px 0;">
          <h2 style="margin: 0; color: #1976d2;">${incident.status.toUpperCase()}</h2>
        </div>
        <p><strong>Fire Type:</strong> ${incident.fireType}</p>
        <p><strong>Last Updated:</strong> ${new Date(incident.updatedAt).toLocaleString()}</p>
        <div style="margin-top: 20px; text-align: center;">
          <a href="${process.env.FRONTEND_URL}/dashboard/incidents/${incident._id}" 
             style="background: #1976d2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
            View Details
          </a>
        </div>
      </div>
    </div>
  `;

  await sendEmail(user.email, subject, html);
};

module.exports = {
  sendEmail,
  sendSMS,
  sendFireAlert,
  sendStatusUpdate
};