import { sendOtpService } from "../services/sendOtpService.js";
import OTP from "../models/otpModel.js";

export const sendOtp = async (req, res, next) => {
  const { email } = req.body;
  const resData = await sendOtpService(email);
  res.status(201).json(resData);
};

export const verifyOtp = async (req, res, next) => {
  const { email, otp } = req.body;
  const otpRecord = await OTP.findOne({ email, otp });

  if (!otpRecord) {
    res.status(400).json({ error: "Invalid or Experied OTP" });
  }

  console.log(otpRecord);

  res.json({ message: "OTP verified" });
};
