import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import { sheetsAction } from "../services/sheetsApi.service.js";
import { signToken } from "../utils/jwt.js";

type SheetUser = {
  id: string;
  email: string;
  name?: string;
  createdAt?: string;
  updatedAt?: string;
};

export const authRoutes = Router();

authRoutes.post("/register", async (req, res, next) => {
  try {
    const data = await sheetsAction<{ user: SheetUser }>("auth.register", {
      email: req.body.email,
      password: req.body.password,
      name: req.body.name
    });

    const token = signToken(data.user);

    res.json({
      token,
      user: data.user
    });
  } catch (error) {
    next(error);
  }
});

authRoutes.post("/login", async (req, res, next) => {
  try {
    const data = await sheetsAction<{ user: SheetUser }>("auth.login", {
      email: req.body.email,
      password: req.body.password
    });

    const token = signToken(data.user);

    res.json({
      token,
      user: data.user
    });
  } catch (error) {
    next(error);
  }
});

authRoutes.get("/me", requireAuth, async (req, res, next) => {
  try {
    const data = await sheetsAction<{ user: SheetUser }>("auth.me", {
      email: req.user?.email
    });

    res.json(data.user);
  } catch (error) {
    next(error);
  }
});
