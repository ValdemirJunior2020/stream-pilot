import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export type TokenUser = {
  id: string;
  email: string;
  name?: string;
};

export function signToken(user: TokenUser) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name || ""
    },
    env.JWT_SECRET,
    {
      expiresIn: env.JWT_EXPIRES_IN as any
    }
  );
}

export function verifyToken(token: string) {
  return jwt.verify(token, env.JWT_SECRET) as TokenUser;
}
