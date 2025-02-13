import appAssert from "../../common/API/AppAssert";
import { loginSchema, registerSchema } from "../../common/schemas/auth";
import {
  clearAuthCookie,
  setAccessTokenCookie,
  setAuthCookies,
} from "../../common/utils/cookie";
import { BAD_REQUEST, CREATED, OK, UNAUTHORIZED } from "../../constants/http";
import pool from "../../database/db/dbConnect";
import Session from "../../database/models/session.model";
import asyncHandler from "../../middlewares/asyncHandler.middleware";
import {
  createUserService,
  loginUserService,
  // refreshTokenService,
} from "../services/auth.service";

//signup
export const signup = asyncHandler(async (req, res) => {
  const body = registerSchema.parse(req.body);
  //using services
  const { user } = await createUserService(body);

  res.status(CREATED).json({
    message: "user created successfully",
    data: user,
  });
});

//login
export const login = asyncHandler(async (req, res) => {
  const body = loginSchema.parse({
    ...req.body,
  });

  const { accessToken, user } = await loginUserService(body);

  const cooki = setAuthCookies({ res, accessToken });

  return cooki.status(OK).json({
    message: "Logged in successfully",
    data: user,
  });
});

//logout
export const logout = asyncHandler(async (req, res) => {
  console.log("user id is :", req.userId)
  const userExists = await pool.query({
    text: `SELECT * FROM tbluser WHERE id = $1`,
    values: [req.userId],
  }) 
  console.log("userExists", userExists)
  const user = userExists.rows[0]
  appAssert(user, BAD_REQUEST, "user does not exist");

  return clearAuthCookie(res).status(OK).json({
    message: "Logged out successfully",
  });
});

// export const accessTokenRefresh = asyncHandler(async (req, res) => {
//   const refreshToken = req.cookies.refreshToken;
//   appAssert(refreshToken, UNAUTHORIZED, "Refresh token  not found");
//   // userId
//   const { accessToken } = await refreshTokenService(refreshToken);
//   return setAccessTokenCookie({ res, accessToken }).status(OK).json({
//     message: "Access token refreshed successfully",
//   });
// });