import catchAsync from "../utils/catchAsync";
import User from "../models/user";
import DB from "../utils/db";
import sendOTP from "../utils/sendOTP";
import { verify, sign } from "jsonwebtoken";

type ITokenPayload = {
  phoneNumber: string;
  exp: number;
  iat: number;
};

const signToken = (phoneNumber: string) => {
  return sign({ phoneNumber }, process.env.JWT_SECRET as string, {
    expiresIn: process.env.JWT_EXPIRATION,
  });
};

export const login = catchAsync(async (req, res, next) => {
  let user;
  const { phoneNumber } = req?.body;
  let verificationCode;
  await DB();
  user = await User.findOne({ phoneNumber });
  if (!user) {
    verificationCode = sendOTP(phoneNumber);
    const newUser = {
      phoneNumber,
      verificationCode,
    };
    user = await User.create(newUser);
  } else {
    if (!!user?.isLoggedInTo) {
      return next(
        res.status(500).json({
          status: "Server error",
          message: "You cannot login to multiple devices",
        })
      );
    }
    verificationCode = sendOTP(phoneNumber);
    user = await User.findByIdAndUpdate(user?._id, {
      verificationCode,
      isVerified: false,
    });
  }
  return next(
    res.status(201).json({
      status: "OK",
      data: user,
    })
  );
});

export const verifyUser = catchAsync(async (req, res, next) => {
  const { phoneNumber, otp, ipAddress } = req?.body;

  if (!phoneNumber) {
    return next(
      res.status(400).json({
        status: "Bad request",
        message: `Please enter a phone number`,
      })
    );
  }
  await DB();
  const user = await User.findOne({ phoneNumber });

  if (!user) {
    return next(
      res.status(404).json({
        status: "Not found",
        message: `User with phone number ${phoneNumber} not found`,
      })
    );
  }
  if (user?.isVerified) {
    return next(
      res.status(500).json({
        status: "Server error",
        message: `Phone number ${phoneNumber} has already been verified`,
      })
    );
  }
  if (otp !== user?.verificationCode) {
    return next(
      res.status(500).json({
        status: "Server error",
        message: `Invalid verification code`,
      })
    );
  }

  const token = signToken(phoneNumber);
  const cookieOptions = {
    expires: new Date(
      Date.now() +
        parseInt(process.env.JWT_COOKIE_EXPIRATION as string) *
          24 *
          60 *
          60 *
          1000
    ),
    httpOnly: true,
    secure: false,
  };

  if (process.env.NODE_ENV === "production") cookieOptions.secure = true;

  res.cookie("jwt", token, cookieOptions);

  const updatedUser = await User.findByIdAndUpdate(user?._id, {
    isVerified: true,
    verificationCode: null,
    isLoggedInTo: ipAddress,
  });

  return next(
    res.status(200).json({
      status: "OK",
      data: {
        user: updatedUser,
        token,
      },
    })
  );
});

export const logout = catchAsync(async (req, res, next) => {
  const { phoneNumber } = req?.body;

  if (!phoneNumber) {
    return next(
      res.status(400).json({
        status: "Bad request",
        message: `Please enter a phone number`,
      })
    );
  }

  await DB();
  const user = await User.findOne({ phoneNumber });

  if (!user) {
    return next(
      res.status(404).json({
        status: "Not found",
        message: `User with phone number ${phoneNumber} not found`,
      })
    );
  }

  const updatedUser = await User.findByIdAndUpdate(user?._id, {
    isLoggedInTo: null,
    isVerified: false,
  });

  return next(
    res.status(200).json({
      status: "OK",
      data: updatedUser,
    })
  );
});

export const protect = catchAsync(async (req: any, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies) {
    token = req.cookies.jwt;
  } else {
    return next(
      res.status(401).json({
        status: "Unauthorized",
        message: "Please login to access this route",
      })
    );
  }

  const verifiedToken = verify(
    token,
    process.env.JWT_SECRET as string
  ) as ITokenPayload;

  if (verifiedToken.exp * 1000 < Date.now()) {
    return next(
      res.status(401).json({
        status: "Unauthorized",
        message: "Invalid token",
      })
    );
  }
  const { phoneNumber } = verifiedToken;

  if (!phoneNumber) {
    return next(
      res.status(400).json({
        status: "Bad request",
        message: `Please enter a phone number`,
      })
    );
  }

  await DB();
  const user = await User.findOne({ phoneNumber });
  if (!user) {
    return next(
      res.status(404).json({
        status: "Not found",
        message: `User with phone number ${phoneNumber} not found`,
      })
    );
  }

  req.user = user;
  return next();
});
