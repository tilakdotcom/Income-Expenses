import { CookieOptions, Response } from "express";
import { fifteenMinuteFromNow, thirtyDaysFromNow } from "./customTime";

type setAuthParams = {
  res: Response;
  accessToken: string;
};

export const REFRESH_PATH = "/api/v1/auth/refresh";

const defaultCookieOptions: CookieOptions = {
  httpOnly: true,
  sameSite: "strict",
  secure: true,
};

const accessTokenCookieOptions = (): CookieOptions => {
  return {
    ...defaultCookieOptions,
    expires: fifteenMinuteFromNow(),
  };
};

const refreshTokenCookieOptions = (): CookieOptions => {
  return {
    ...defaultCookieOptions,
    path: REFRESH_PATH,
    expires: thirtyDaysFromNow(),
  };
};

export const setAuthCookies = ({ res, accessToken }: setAuthParams) => {
  return res.cookie("accessToken", accessToken, accessTokenCookieOptions());
};

export const clearAuthCookie = (res: Response) => {
  return res.clearCookie("accessToken");
};

type setAccessTokenParams = {
  res: Response;
  accessToken: string;
};

export const setAccessTokenCookie = ({
  res,
  accessToken,
}: setAccessTokenParams) => {
  return res.cookie("accessToken", accessToken, accessTokenCookieOptions());
};

type setRefreshTokenParams = {
  res: Response;
  refreshToken: string;
};

export const setRefreshTokenCookie = ({
  res,
  refreshToken,
}: setRefreshTokenParams) => {
  return res.cookie("refreshToken", refreshToken, refreshTokenCookieOptions());
};
