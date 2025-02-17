import User from "../../database/models/user.model";
import appAssert from "../../common/API/AppAssert";
import {
  BAD_REQUEST,
  INTERNAL_SERVER_ERROR,
  UNAUTHORIZED,
} from "../../constants/http";
import uploadFileToCloudinary from "../../common/utils/cloudinary";
import VerifyCation from "../../database/models/vaerifiacation.model";
import { verificationCode } from "../../common/enum/verificationCode";
import { fifteenMinuteFromNow, Now } from "../../common/utils/customTime";
import { passwordCompare, passwordHasher } from "../../common/utils/bcryptjs";
import Session from "../../database/models/session.model";
import ApiError from "../../common/API/ApiError";
import {
  sendForgotPasswordEmail,
  sendVerificationEmail,
} from "../../mail/mailer";
import { CLIENT_URI } from "../../constants/getEnv";
import pool from "../../database/db/dbConnect";

type UserAvatar = {
  avatar: string;
  userId: string;
};

export const userAvatarService = async (data: UserAvatar) => {
  const user = await User.findOne({ _id: data.userId });
  appAssert(user, BAD_REQUEST, "user not found");
  const avatar = await uploadFileToCloudinary(data.avatar);

  user.avatar = avatar.secure_url;
  await user.save({ validateBeforeSave: false });

  return { user };
};

type UserPasswordResetRequestType = {
  email: string;
};

export const userPasswordResetRequestService = async (
  data: UserPasswordResetRequestType
) => {
  const user = await User.findOne({ email: data.email });
  appAssert(user, BAD_REQUEST, "user not found");

  const count = await VerifyCation.countDocuments({
    userId: user._id,
    expiresAt: {
      $gte: Now(),
    },
  });
  if (count > 2) {
    throw new ApiError(
      BAD_REQUEST,
      "You have exceeded the maximum number of documents"
    );
  }

  const passwordResetVerificationCode = await VerifyCation.create({
    userId: user._id,
    type: verificationCode.PASSWORD_RESET,
    expiresAt: fifteenMinuteFromNow(),
  });

  const url = `${CLIENT_URI}/reset-password/${passwordResetVerificationCode._id}`;

  sendForgotPasswordEmail(data.email, url);

  return { passwordResetVerificationCode };
};

type UserPasswordChangeServiceType = {
  oldPassword: string;
  newPassword: string;
  userId: string;
};

export const userPasswordChangeService = async (
  data: UserPasswordChangeServiceType
) => {
  const userExists = await pool.query({
    text: `SELECT * FROM tbluser WHERE id=$1`,
    values: [data.userId],
  });
  const user = userExists.rows[0];
  appAssert(user, BAD_REQUEST, "Invalid user");

  const isMatched = await passwordCompare(data.oldPassword, user.password);

  appAssert(isMatched, BAD_REQUEST, "Invalid old password");
  const hashedPassword = await passwordHasher(data.newPassword);

  const updatePassword = await pool.query({
    text: `UPDATE tbluser SET password=$1 WHERE id=$2 RETURNING *`,
    values: [hashedPassword, data.userId],
  });

  const updatedUser = updatePassword.rows[0];

  updatedUser.password = undefined;

  return { user: updatePassword.rows[0] };
};

export const userVerifyEmailRequestService = async (userId: string) => {
  const user = await User.findOne({ _id: userId });
  appAssert(user, BAD_REQUEST, "User not found");

  const count = await VerifyCation.countDocuments({ userId: userId });

  if (count >= 2) {
    throw new ApiError(
      BAD_REQUEST,
      "You have already reached the maximum number of limit try again laterr."
    );
  }

  const verification = await VerifyCation.create({
    userId: userId,
    expiresAt: fifteenMinuteFromNow(),
    type: verificationCode.VERIFICATION_EMAIL,
  });

  // sent email
  const url = `${CLIENT_URI}/email-verify/${verification._id}`;
  sendVerificationEmail(user.email, url);
  return {
    verification,
  };
};

export const userVerifyEmailService = async (id: string) => {
  const verification = await VerifyCation.findOne({
    _id: id,
    expiresAt: { $gte: Now() },
  });
  appAssert(verification, BAD_REQUEST, "Token has expired");

  const user = await User.findOne({ _id: verification.userId });
  appAssert(user, BAD_REQUEST, "Token has expired");

  user.verifiedEmail = true;
  await user.save({ validateBeforeSave: false });

  //deleting the verification
  await VerifyCation.deleteMany({
    userId: user._id,
    type: verificationCode.VERIFICATION_EMAIL,
  });

  return { user: user.publicUser() };
};

type UpdateProfileServiceType = {
  userId: string;
  firstName: string | undefined;
  lastName: string | undefined;
  country: string | undefined;
  currency: string | undefined;
  contact: string | undefined;
};

export const updateProfileService = async (
  data: UpdateProfileServiceType
) => {
  const userExists = await pool.query({
    text: `SELECT * FROM tbluser WHERE id=$1`,
    values: [data.userId],
  });
  const user = userExists.rows[0];
  appAssert(user, BAD_REQUEST, "Invalid user");
  const textData =[]
  if (data.firstName) {
    textData.push(`first_name='${data.firstName}'`);
  }
  if (data.lastName) {
    textData.push(`last_name='${data.lastName}'`);
  }
  if (data.country) {
    textData.push(`country='${data.country}'`);
  }
  if (data.currency) {
    textData.push(`currency='${data.currency}'`);
  }
  if (data.contact) {
    textData.push(`contact='${data.contact}'`);
  }

  const queryText =  `UPDATE tbluser SET ${textData.join(" ,")}, updated_at=CURRENT_TIMESTAMP WHERE id=${data.userId} RETURNING *`

  const updatePassword = await pool.query({
    text:queryText,
  });

  const updatedUser = updatePassword.rows[0];

  updatedUser.password = undefined;

  return { user: updatePassword.rows[0] };
};
