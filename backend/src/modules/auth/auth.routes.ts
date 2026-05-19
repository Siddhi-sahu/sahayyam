import { Router } from "express";
import { asyncHandler } from "../../lib/http";
import { requireAuth, type AuthedRequest } from "../../middleware/auth";
import { loginSchema, registerSchema } from "./auth.schemas";
import * as authService from "./auth.service";

export const authRouter = Router();

authRouter.post(
  "/register",
  asyncHandler(async (req, res) => {
    const payload = registerSchema.parse(req.body);
    const result = await authService.register(payload);
    res.status(201).json(result);
  }),
);

authRouter.post(
  "/login",
  asyncHandler(async (req, res) => {
    const payload = loginSchema.parse(req.body);
    const result = await authService.login(payload);
    res.json(result);
  }),
);

authRouter.get(
  "/me",
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const user = await authService.me(req.user!.id);
    res.json({ user });
  }),
);
