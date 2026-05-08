import nodemailer from "nodemailer";

let transporter = null;
function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }
  return transporter;
}

/**
 * Send a styled HTML invoice email after a successful plan upgrade.
 */
export const sendInvoiceEmail = async ({
  userEmail,
  userName,
  planName,
  amountINR,
  paymentId,
  orderId,
  date,
  watchLimit,
}) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn("Email credentials not configured – skipping invoice email.");
    return;
  }

  const formattedDate = new Date(date).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const watchLimitText = watchLimit
    ? `${watchLimit} minutes per video`
    : "Unlimited";

  const planColors = {
    Bronze: { bg: "#FEF3C7", accent: "#D97706", badge: "#92400E" },
    Silver: { bg: "#F1F5F9", accent: "#6366F1", badge: "#3730A3" },
    Gold: { bg: "#FEF9C3", accent: "#EAB308", badge: "#854D0E" },
  };

  const colors = planColors[planName] || planColors.Bronze;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1e1e2e,#2d2d44);padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;letter-spacing:-0.5px;">
                🎬 YourTube NXTGen
              </h1>
              <p style="margin:8px 0 0;color:#a1a1aa;font-size:14px;">Payment Confirmation & Invoice</p>
            </td>
          </tr>

          <!-- Success Banner -->
          <tr>
            <td style="padding:24px 40px 0;">
              <div style="background:#ecfdf5;border:1px solid #a7f3d0;border-radius:12px;padding:16px 20px;text-align:center;">
                <p style="margin:0;color:#065f46;font-size:16px;font-weight:600;">
                  ✅ Payment Successful!
                </p>
                <p style="margin:4px 0 0;color:#047857;font-size:13px;">
                  Your plan has been upgraded successfully
                </p>
              </div>
            </td>
          </tr>

          <!-- Plan Badge -->
          <tr>
            <td style="padding:24px 40px 0;text-align:center;">
              <div style="display:inline-block;background:${colors.bg};border:2px solid ${colors.accent};border-radius:50px;padding:10px 32px;">
                <span style="color:${colors.badge};font-size:20px;font-weight:700;letter-spacing:0.5px;">
                  ${planName} Plan
                </span>
              </div>
            </td>
          </tr>

          <!-- Invoice Details -->
          <tr>
            <td style="padding:24px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#fafafa;border-radius:12px;border:1px solid #e4e4e7;">
                <tr>
                  <td style="padding:20px 24px;">
                    <h3 style="margin:0 0 16px;color:#18181b;font-size:16px;font-weight:600;border-bottom:1px solid #e4e4e7;padding-bottom:12px;">
                      📋 Invoice Details
                    </h3>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:6px 0;color:#71717a;font-size:13px;">Customer</td>
                        <td style="padding:6px 0;color:#18181b;font-size:13px;text-align:right;font-weight:500;">${userName}</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;color:#71717a;font-size:13px;">Email</td>
                        <td style="padding:6px 0;color:#18181b;font-size:13px;text-align:right;font-weight:500;">${userEmail}</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;color:#71717a;font-size:13px;">Plan</td>
                        <td style="padding:6px 0;color:${colors.badge};font-size:13px;text-align:right;font-weight:600;">${planName}</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;color:#71717a;font-size:13px;">Watch Limit</td>
                        <td style="padding:6px 0;color:#18181b;font-size:13px;text-align:right;font-weight:500;">${watchLimitText}</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;color:#71717a;font-size:13px;">Payment ID</td>
                        <td style="padding:6px 0;color:#18181b;font-size:12px;text-align:right;font-family:monospace;">${paymentId}</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;color:#71717a;font-size:13px;">Order ID</td>
                        <td style="padding:6px 0;color:#18181b;font-size:12px;text-align:right;font-family:monospace;">${orderId}</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;color:#71717a;font-size:13px;">Date</td>
                        <td style="padding:6px 0;color:#18181b;font-size:13px;text-align:right;font-weight:500;">${formattedDate}</td>
                      </tr>
                      <tr>
                        <td colspan="2" style="padding:12px 0 0;border-top:1px solid #e4e4e7;"></td>
                      </tr>
                      <tr>
                        <td style="padding:4px 0;color:#18181b;font-size:16px;font-weight:700;">Total Paid</td>
                        <td style="padding:4px 0;color:#18181b;font-size:20px;text-align:right;font-weight:700;">₹${amountINR}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#fafafa;padding:20px 40px;text-align:center;border-top:1px solid #e4e4e7;">
              <p style="margin:0;color:#a1a1aa;font-size:12px;">
                This is an automated invoice from YourTube NXTGen.<br/>
                If you have questions, reply to this email.
              </p>
              <p style="margin:8px 0 0;color:#d4d4d8;font-size:11px;">
                © ${new Date().getFullYear()} YourTube NXTGen. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const mailOptions = {
    from: `"YourTube NXTGen" <${process.env.EMAIL_USER}>`,
    to: userEmail,
    subject: `✅ ${planName} Plan Activated – Invoice #${paymentId.slice(-8).toUpperCase()}`,
    html,
  };

  try {
    await getTransporter().sendMail(mailOptions);
    console.log(`Invoice email sent to ${userEmail}`);
  } catch (error) {
    console.error("Failed to send invoice email:", error.message);
  }
};
