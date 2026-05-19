import { Router } from "express";
import { asyncHandler } from "../../lib/http";
import { requireAuth, type AuthedRequest } from "../../middleware/auth";
import * as nudgeService from "./nudge.service";

export const nudgeRouter = Router();

nudgeRouter.get(
  "/",
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const nudges = await nudgeService.getNudges(req.user!.id);
    res.json({ nudges });
  }),
);
