import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../prisma/client.js";
import { env } from "../config/env.js";
import { HttpError } from "../utils/http.js";
import { loginWithSheets, registerWithSheets, type SheetsUser } from "./sheetsAuth.service.js";

export type RegisterInput = {
  email: string;
  password: string;
  name?: string;
};

export type LoginInput = {
  email: string;
  password: string;
};

function signToken(user: { id: string; email: string }) {
  return jwt.sign({ sub: user.id, email: user.email }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN
  });
}

function publicUser(user: { id: string; email: string; name: string | null; createdAt: Date }) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    createdAt: user.createdAt
  };
}

async function upsertLocalUserFromSheets(sheetUser: SheetsUser) {
  const email = sheetUser.email.toLowerCase();

  return prisma.user.upsert({
    where: { email },
    create: {
      email,
      name: sheetUser.name || null,
      passwordHash: "__GOOGLE_SHEETS_AUTH__"
    },
    update: {
      name: sheetUser.name || undefined
    }
  });
}

async function registerLocal(input: RegisterInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email.toLowerCase() } });
  if (existing) {
    throw new HttpError(409, "Este email já está cadastrado.");
  }

  const passwordHash = await bcrypt.hash(input.password, 12);
  const user = await prisma.user.create({
    data: {
      email: input.email.toLowerCase(),
      name: input.name,
      passwordHash
    }
  });

  return {
    token: signToken(user),
    user: publicUser(user)
  };
}

async function loginLocal(input: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email.toLowerCase() } });
  if (!user) {
    throw new HttpError(401, "Email ou senha inválidos.");
  }

  const isValid = await bcrypt.compare(input.password, user.passwordHash);
  if (!isValid) {
    throw new HttpError(401, "Email ou senha inválidos.");
  }

  return {
    token: signToken(user),
    user: publicUser(user)
  };
}

export async function register(input: RegisterInput) {
  if (env.AUTH_PROVIDER === "google_sheets") {
    const sheetUser = await registerWithSheets(input);
    const user = await upsertLocalUserFromSheets(sheetUser);

    return {
      token: signToken(user),
      user: publicUser(user)
    };
  }

  return registerLocal(input);
}

export async function login(input: LoginInput) {
  if (env.AUTH_PROVIDER === "google_sheets") {
    const sheetUser = await loginWithSheets(input);
    const user = await upsertLocalUserFromSheets(sheetUser);

    return {
      token: signToken(user),
      user: publicUser(user)
    };
  }

  return loginLocal(input);
}

export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, createdAt: true }
  });

  if (!user) {
    throw new HttpError(404, "Usuário não encontrado.");
  }

  return user;
}
