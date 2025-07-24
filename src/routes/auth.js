const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient({ log: ["query"] });
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";
const { sendOtpToPhone } = require("../services/twilioService"); // Twilio service
const sgMail = require("@sendgrid/mail");
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Helper to generate 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}


// Generate OTP for the field entered.
router.post("/signup-first", async (req, res) => {
  const { field } = req.body;

  if (!field) {
    return res.status(400).json({ error: "Email or phone number is required" });
  }

  const isEmail = /\S+@\S+\.\S+/.test(field);
  const isPhone = /^\+?[1-9]\d{9,14}$/.test(field);

  if (!isEmail && !isPhone) {
    return res.status(400).json({ error: "Invalid email or phone format" });
  }

  try {
    // Check if user already exists
    const userExists = await prisma.user.findFirst({
      where: isEmail ? { email: field } : { phoneNumber: field },
    });

    if (userExists) {
      return res.status(400).json({ error: "User already exists" });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await prisma.oTP.create({
      data: {
        otp,
        expiresAt,
        attempts: 0,
        purpose: "signup-first",
        med_of_del: isEmail ? "email" : "sms",
        email: isEmail ? field : null,
        phoneNumber: isPhone ? field : null,
      },
    });

    console.log(`OTP sent to ${field}: ${otp}`);
    return res.status(200).json({ message: "OTP sent successfully" });
  } catch (err) {
    console.error("Signup error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});





//Verify the OTP sent for Signup Purpose
router.post("/verify-signup-otp", async (req, res) => {
  const { signupField, otp, purpose } = req.body;

  if (!signupField || !otp || !purpose) {
    return res.status(400).json({ error: "signupField, otp, and purpose are required" });
  }

  const isEmail = /\S+@\S+\.\S+/.test(signupField);
  const isPhone = /^\+?[1-9]\d{9,14}$/.test(signupField);

  if (!isEmail && !isPhone) {
    return res.status(400).json({ error: "Invalid email or phone format" });
  }

  try {
    const otpRecord = await prisma.oTP.findFirst({
      where: {
        purpose,
        otp: otp.trim(),
        email: isEmail ? signupField : undefined,
        phoneNumber: isPhone ? signupField : undefined,
      },
      orderBy: { createdAt: "desc" },
    });

    if (!otpRecord) {
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }

    const now = new Date();
    if (now > otpRecord.expiresAt) {
      return res.status(400).json({ error: "OTP has expired" });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: isEmail ? { email: signupField } : { phoneNumber: signupField },
    });

    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    // Create user
    const newUser = await prisma.user.create({
      data: isEmail
        ? { email: signupField }
        : { phoneNumber: signupField },
    });

    const token = jwt.sign({ userId: newUser.id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    return res.status(201).json({ message: "User created successfully", token });
  } catch (err) {
    console.error("OTP verification error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});




//second signup
router.post("/signup-second", async (req, res) => {
  try {
    const { existingfield, fillup_field, purpose } = req.body;

    if (!existingfield) {
      return res.status(400).json({ error: "existingfield is required" });
    }

    const isExistingEmail = /\S+@\S+\.\S+/.test(existingfield);
    const isExistingPhone = /^\+?[1-9]\d{9,14}$/.test(existingfield);

    if (!isExistingEmail && !isExistingPhone) {
      return res.status(400).json({ error: "Invalid existingfield format" });
    }

    const user = await prisma.user.findFirst({
      where: isExistingEmail
        ? { email: existingfield }
        : { phoneNumber: existingfield },
    });

    if (!user) {
      return res
        .status(404)
        .json({ error: "User not found with provided existingfield" });
    }

    const existingOtp = await prisma.oTP.findFirst({
      where: isExistingEmail
        ? { email: existingfield }
        : { phoneNumber: existingfield },
      orderBy: { createdAt: "desc" },
    });

    if (!existingOtp) {
      return res.status(404).json({ error: "OTP record for existingfield not found" });
    }

    // If fillup_field is skipped (null, undefined, empty string)
    if (!fillup_field || fillup_field.trim() === "") {
      // Update OTP, expiry, attempts but do NOT add fillup_field
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

      await prisma.oTP.update({
        where: { id: existingOtp.id },
        data: {
          otp: otpCode,
          expiresAt,
          attempts: 0,
          purpose: purpose || "signup-second",
          email: existingOtp.email || null,
          phoneNumber: existingOtp.phoneNumber || null,
          med_of_del: existingOtp.med_of_del || null,
        },
      });

      console.log(`Step skipped successfully for ${existingfield}`);

      return res.status(200).json({
        message: "Step skipped successfully",
        skippedFillupField: true,
      });
    }

    // If fillup_field provided, validate and update as before
    const isFillupEmail = /\S+@\S+\.\S+/.test(fillup_field);
    const isFillupPhone = /^\+?[1-9]\d{9,14}$/.test(fillup_field);

    if (!isFillupEmail && !isFillupPhone) {
      return res.status(400).json({ error: "Invalid fillup_field format" });
    }

    const alreadyUsed = await prisma.user.findFirst({
      where: isFillupEmail ? { email: fillup_field } : { phoneNumber: fillup_field },
    });

    if (alreadyUsed) {
      return res.status(400).json({ error: "This fillup_field is already in use" });
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    const updateData = {
      otp: otpCode,
      expiresAt,
      attempts: 0,
      purpose: purpose || "signup-second",
      med_of_del: isFillupEmail ? "email" : "sms",
    };

    if (isFillupEmail) {
      updateData.email = fillup_field;
      updateData.phoneNumber = existingOtp.phoneNumber || null;
    } else {
      updateData.phoneNumber = fillup_field;
      updateData.email = existingOtp.email || null;
    }

    await prisma.oTP.update({
      where: { id: existingOtp.id },
      data: updateData,
    });

    console.log(`OTP for ${fillup_field}: ${otpCode}`);

    res.status(200).json({
      message: `OTP sent successfully to ${fillup_field}`,
      otpSentTo: fillup_field,
      skippedFillupField: false,
    });
  } catch (err) {
    console.error("Signup-second error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});




// Verify the Second OTP.
router.post("/verify-signup-second-otp", async (req, res) => {
  try {
    let { existing_field, fillup_field, otp, purpose } = req.body;

    if (!fillup_field || !otp || !purpose || !existing_field) {
      return res.status(400).json({ error: "existing_field, fillup_field, otp, and purpose are required" });
    }

    existing_field = existing_field.trim();
    fillup_field = fillup_field.trim();
    otp = otp.trim();
    purpose = purpose.trim();

    // Check if existing_field is email or phone
    const isExistingEmail = /\S+@\S+\.\S+/.test(existing_field);
    const isExistingPhone = /^\+?[1-9]\d{9,14}$/.test(existing_field);

    if (!isExistingEmail && !isExistingPhone) {
      return res.status(400).json({ error: "Invalid existing_field format" });
    }

    // Check if fillup_field is email or phone
    const isFillupEmail = /\S+@\S+\.\S+/.test(fillup_field);
    const isFillupPhone = /^\+?[1-9]\d{9,14}$/.test(fillup_field);

    if (!isFillupEmail && !isFillupPhone) {
      return res.status(400).json({ error: "Invalid fillup_field format" });
    }

    // Find latest OTP for existing_field and purpose
    const otpRecord = await prisma.oTP.findFirst({
      where: {
        purpose,
        ...(isExistingEmail
          ? { email: existing_field }
          : { phoneNumber: existing_field }),
      },
      orderBy: { createdAt: "desc" },
    });

    if (!otpRecord) {
      return res.status(400).json({ error: "No OTP found for this field" });
    }

    if (otpRecord.otp.trim() !== otp) {
      return res.status(400).json({ error: "Invalid OTP" });
    }

    if (new Date() > otpRecord.expiresAt) {
      return res.status(400).json({ error: "OTP expired" });
    }

    // Find user by existing_field
    const user = await prisma.user.findFirst({
      where: isExistingEmail
        ? { email: existing_field }
        : { phoneNumber: existing_field },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Update user with fillup_field
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: isFillupEmail
        ? { email: fillup_field }
        : { phoneNumber: fillup_field },
    });

    return res.status(200).json({
      message: "OTP verified and user updated successfully",
      user: updatedUser,
    });
  } catch (err) {
    console.error("Verify signup-second OTP error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});



//Set Password for the user.
router.post("/set-password", async (req, res) => {
  const { signupField, password } = req.body;

  if (!signupField || !password) {
    return res
      .status(400)
      .json({ error: "signupField and password are required" });
  }

  const isEmail = /\S+@\S+\.\S+/.test(signupField);
  const isPhone = /^\+?[1-9]\d{9,14}$/.test(signupField);

  if (!isEmail && !isPhone) {
    return res.status(400).json({ error: "Invalid signupField format" });
  }

  try {
    const user = await prisma.user.findFirst({
      where: isEmail ? { email: signupField } : { phoneNumber: signupField },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update user's password
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    return res.status(200).json({ message: "Password set successfully" });
  } catch (err) {
    console.error("Set password error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});







// Generate OTP
router.post("/generate-otp", async (req, res) => {
  const { phoneNumber } = req.body;
  console.log("Received phoneNumber:", phoneNumber);

  if (!phoneNumber) {
    return res.status(400).json({ error: "phoneNumber is required" });
  }

  try {
    const user = await prisma.user.findUnique({ where: { phoneNumber } });
    if (!user) {
      return res
        .status(404)
        .json({ error: "User not found with this phone number" });
    }

    const now = new Date();

    // Get today's midnight
    const midnight = new Date();
    midnight.setHours(0, 0, 0, 0); // 12:00 AM today

    // Get the latest OTP record
    const latestOtpRow = await prisma.oTP.findFirst({
      where: { userId: user.id },
      orderBy: { id: "desc" },
      select: {
        id: true,
        attempts: true,
        createdAt: true,
      },
    });

    let newAttempts = 1;

    if (latestOtpRow) {
      const lastOtpDate = new Date(latestOtpRow.createdAt);

      if (lastOtpDate >= midnight) {
        // Still same day, continue counting attempts
        newAttempts = latestOtpRow.attempts + 1;
        if (newAttempts > 3) {
          return res.status(429).json({
            error: "Maximum Attempts Exceeded. Try again after midnight.",
          });
        }
      } else {
        // New day, reset attempts
        newAttempts = 1;
      }
    }

    const otpCode = generateOTP();
    const expiresAt = new Date(now.getTime() + 3 * 60 * 1000); // Expires in 3 mins

    await prisma.oTP.create({
      data: {
        userId: user.id,
        otp: otpCode,
        createdAt: now,
        expiresAt,
        attempts: newAttempts,
        phoneNumber: user.phoneNumber,
      },
    });

    // await sendOtpToPhone(user.phoneNumber, otpCode);

    console.log(
      `OTP for phone ${phoneNumber}: ${otpCode} (Attempt #${newAttempts})`
    );

    return res.status(200).json({
      message: `OTP generated and sent successfully. Attempt #${newAttempts}`,
    });
  } catch (err) {
    console.error("Generate OTP error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

// Verify OTP
router.post("/verify-otp", async (req, res) => {
  const { phoneNumber, otp } = req.body;

  if (!phoneNumber || !otp)
    return res.status(400).json({ error: "phoneNumber and otp are required" });

  try {
    const user = await prisma.user.findUnique({ where: { phoneNumber } });
    if (!user) return res.status(404).json({ error: "User not found" });

    const latestOtp = await prisma.oTP.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    if (!latestOtp)
      return res.status(400).json({ error: "No OTP found for this user" });

    const now = new Date();
    if (now > latestOtp.expiresAt) {
      return res.status(400).json({ error: "OTP expired" });
    }

    if (latestOtp.otp !== otp) {
      return res.status(400).json({ error: "Invalid OTP" });
    }

    res.status(200).json({ message: "OTP verified successfully" });
  } catch (err) {
    console.error("Verify OTP error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Generate Email OTP
router.post("/generate-email-otp", async (req, res) => {
  const { purpose, email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  // Apply request  body validation
  try {
    const now = new Date();
    const midnight = new Date();
    midnight.setHours(0, 0, 0, 0);

    const latestOtp = await prisma.oTP.findFirst({
      where: {
        email,
        med_of_del: "email",
        purpose,
      },
      orderBy: { createdAt: "desc" },
    });

    let newAttempts = 1;
    if (latestOtp && new Date(latestOtp.createdAt) >= midnight) {
      newAttempts = latestOtp.attempts + 1;
      if (newAttempts > 3) {
        return res.status(429).json({
          error: "Max OTP attempts reached. Try again after midnight.",
        });
      }
    }

    const otp = generateOTP();
    const expiresAt = new Date(now.getTime() + 3 * 60 * 1000); // 3 minutes expiry

    await prisma.oTP.create({
      data: {
        otp,
        createdAt: now,
        expiresAt,
        attempts: newAttempts,
        email,
        purpose,
        med_of_del: "email",
      },
    });

    const message = {
      to: email,
      from: "joshianish060@gmail.com", // ✅ must be verified in SendGrid
      subject: "Email Verification OTP",
      text: `Hello, your ${purpose} OTP is: ${otp}. It is valid for 3 minutes.`,
    };

    await sgMail.send(message);

    console.log(`Email OTP for ${email}: ${otp} (Attempt #${newAttempts})`);

    return res
      .status(200)
      .json({ message: `OTP sent to ${email}. Attempt #${newAttempts}` });
  } catch (err) {
    console.error("Email OTP error:", err);
    console.log(err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ error: "Email and password required" });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.password)
      return res.status(401).json({ error: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
      expiresIn: "1d",
    });
    res.json({ message: "Login successful", token });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
