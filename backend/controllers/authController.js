import { sendOtpService } from "../services/sendOtpService.js";
import OTP from "../models/otpModel.js";
import { verifyIdToken } from "../services/googleAuthService.js";
import User from "../models/userModel.js";
import mongoose, { Types } from "mongoose";
import Directory from "../models/directoryModel.js";
import Session from "../models/sessionModel.js";

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

export const loginWithGoogle = async (req, res, next) => {
  const idToken = req.body.idToken;
  const userData = await verifyIdToken(idToken);
  const { name, email, picture, sub } = userData;
  const user = await User.findOne({ email }).select("-__v");
  if (user) {
    if (user.deleted) {
      return res.status(401).json({error: "Your Account has been deleted. Contact app admin to recover account"})
    }
    const allSessions = await Session.find({ userId: user.id });

    if (allSessions.length >= 2) {
      await allSessions[0].deleteOne();
    }

    if (!user.picture.includes("googleusercontent.com")) {
      user.picture = picture
      await user.save()
    }

    const session = await Session.create({ userId: user._id });

    res.cookie("sid", session.id, {
      httpOnly: true,
      signed: true,
      maxAge: 60 * 1000 * 60 * 24 * 7,
    });
    return res.json({ message: "login" });
  }
  const mongooseSession = await mongoose.startSession();

  try {
    const rootDirId = new Types.ObjectId();
    const userId = new Types.ObjectId();

    mongooseSession.startTransaction();

    await Directory.insertOne(
      {
        _id: rootDirId,
        name: `root-${email}`,
        parentDirId: null,
        userId,
      },
      { mongooseSession }
    );

    await User.insertOne(
      {
        _id: userId,
        name,
        email,
        picture,
        rootDirId,
      },
      { mongooseSession }
    );

 

    const session = await Session.create({ userId: userId });

    res.cookie("sid", session.id, {
      httpOnly: true,
      signed: true,
      maxAge: 60 * 1000 * 60 * 24 * 7,
    });
    mongooseSession.commitTransaction();
    res.status(201).json({ message: "account created and login" });
  } catch (err) {
    mongooseSession.abortTransaction();
    next(err);
  }
};
