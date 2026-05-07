import nodemailer from "nodemailer";
import OTP from "../Modals/otp.js";
import users from "../Modals/Auth.js";
import fetch from "node-fetch";

const SOUTH_INDIAN_STATES = [
  "tamil nadu",
  "kerala",
  "karnataka",
  "andhra pradesh",
  "telangana",
];

function isSouthIndian(stateName) {
  if (!stateName) return false;
  return SOUTH_INDIAN_STATES.includes(stateName.toLowerCase().trim());
}

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

let _transporter = null;
function getTransporter() {
  if (!_transporter) {
    _transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }
  return _transporter;
}

/**
 * Send OTP email with a styled template
 */
async function sendOTPEmail(email, otp) {
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="500" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <tr>
            <td style="background:linear-gradient(135deg,#1e1e2e,#2d2d44);padding:28px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">🎬 YourTube NXTGen</h1>
              <p style="margin:6px 0 0;color:#a1a1aa;font-size:13px;">Login Verification</p>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 40px;text-align:center;">
              <p style="margin:0 0 8px;color:#18181b;font-size:16px;font-weight:600;">Your One-Time Password</p>
              <p style="margin:0 0 24px;color:#71717a;font-size:13px;">Use this code to verify your login. It expires in 5 minutes.</p>
              <div style="display:inline-block;background:#f0f9ff;border:2px solid #3b82f6;border-radius:12px;padding:16px 40px;">
                <span style="font-size:32px;font-weight:800;letter-spacing:8px;color:#1d4ed8;font-family:monospace;">${otp}</span>
              </div>
              <p style="margin:24px 0 0;color:#a1a1aa;font-size:12px;">If you didn't request this, please ignore this email.</p>
            </td>
          </tr>
          <tr>
            <td style="background:#fafafa;padding:16px 40px;text-align:center;border-top:1px solid #e4e4e7;">
              <p style="margin:0;color:#d4d4d8;font-size:11px;">© ${new Date().getFullYear()} YourTube NXTGen. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  await getTransporter().sendMail({
    from: `"YourTube NXTGen" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `🔐 Your OTP for YourTube NXTGen Login: ${otp}`,
    html,
  });
}

/**
 * Send OTP via SMS using Fast2SMS API
 */
async function sendOTPSMS(phone, otp) {
  const apiKey = process.env.FAST2SMS_API_KEY;
  if (!apiKey) {
    throw new Error("FAST2SMS_API_KEY not configured");
  }

  // Remove +91 or 91 prefix if present, keep only 10 digits
  const cleanPhone = phone.replace(/^(\+91|91)/, "").replace(/\D/g, "");

  const response = await fetch("https://www.fast2sms.com/dev/bulkV2", {
    method: "POST",
    headers: {
      "authorization": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      route: "otp",
      variables_values: otp,
      numbers: cleanPhone,
      flash: 0,
    }),
  });

  const data = await response.json();
  if (!data.return) {
    console.error("Fast2SMS error:", data);
    throw new Error(data.message?.[0] || "SMS sending failed");
  }
  return data;
}

/**
 * POST /otp/send
 * Body: { email, name, image, state }
 * 
 * Determines OTP method based on user's state:
 *   - South Indian states → email OTP
 *   - Other states → SMS OTP (simulated via email for demo)
 */
export const sendOtp = async (req, res) => {
  const { email, name, image, state, phone } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  try {
    const isSouth = isSouthIndian(state);
    const method = isSouth ? "email" : "sms";

    // For non-south states, phone is required for SMS
    if (!isSouth && !phone) {
      return res.status(200).json({
        needsPhone: true,
        method: "sms",
        isSouthIndia: false,
        message: "Phone number required for SMS OTP verification",
      });
    }

    // Create or find user first
    let user = await users.findOne({ email });
    if (!user) {
      user = await users.create({ email, name, image, phone: phone || "", state: state || "" });
    } else {
      if (state) user.state = state;
      if (phone) user.phone = phone;
      await user.save();
    }

    const otp = generateOTP();

    // Remove any existing OTPs for this user
    await OTP.deleteMany({ userEmail: email });

    const target = isSouth ? email : phone;

    // Store OTP
    await OTP.create({
      target,
      method,
      otp,
      userEmail: email,
    });

    // Send OTP
    let actualMethod = method;
    if (method === "email") {
      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        return res.status(500).json({ message: "Email service not configured" });
      }
      await sendOTPEmail(target, otp);
    } else {
      // SMS method — try Fast2SMS, fall back to email if it fails
      let smsSent = false;
      if (process.env.FAST2SMS_API_KEY) {
        try {
          await sendOTPSMS(phone, otp);
          smsSent = true;
        } catch (smsErr) {
          console.warn("SMS sending failed, falling back to email:", smsErr.message);
        }
      }
      if (!smsSent) {
        // Fallback: send OTP via email
        console.log("Sending mobile OTP via email fallback to:", email);
        await sendOTPEmail(email, otp);
        actualMethod = "email_fallback";
      }
    }

    return res.status(200).json({
      message: actualMethod === "email_fallback"
        ? `SMS unavailable — OTP sent to your email instead`
        : `OTP sent successfully via ${method}`,
      method: actualMethod === "email_fallback" ? "email" : method,
      needsPhone: false,
      target: actualMethod === "email_fallback"
        ? email.replace(/(.{2})(.*)(@.*)/, "$1***$3")
        : method === "email"
        ? email.replace(/(.{2})(.*)(@.*)/, "$1***$3")
        : phone.replace(/(\d{2})(\d+)(\d{2})/, "$1****$3"),
      isSouthIndia: isSouth,
    });
  } catch (error) {
    console.error("Send OTP error:", error);
    return res.status(500).json({ message: "Failed to send OTP" });
  }
};

/**
 * POST /otp/verify
 * Body: { email, otp }
 * 
 * Verifies OTP and returns user data on success.
 */
export const verifyOtp = async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ message: "Email and OTP are required" });
  }

  try {
    const otpRecord = await OTP.findOne({
      userEmail: email,
      otp,
      verified: false,
    });

    if (!otpRecord) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    // Mark as verified
    otpRecord.verified = true;
    await otpRecord.save();

    // Get or create user
    let user = await users.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Clean up used OTPs
    await OTP.deleteMany({ userEmail: email });

    return res.status(200).json({
      message: "OTP verified successfully",
      result: user,
    });
  } catch (error) {
    console.error("Verify OTP error:", error);
    return res.status(500).json({ message: "Failed to verify OTP" });
  }
};
