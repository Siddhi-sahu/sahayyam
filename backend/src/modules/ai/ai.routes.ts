import { Router } from "express";
import { asyncHandler } from "../../lib/http";
import { requireAuth, type AuthedRequest } from "../../middleware/auth";
import { askSchema, enrichTipSchema } from "./ai.schemas";
import * as aiService from "./ai.service";

export const aiRouter = Router();

aiRouter.post(
  "/enrich-tip",
  requireAuth,
  asyncHandler(async (req, res) => {
    const payload = enrichTipSchema.parse(req.body);
    const result = await aiService.enrichTip(payload);
    res.json(result);
  }),
);

aiRouter.post(
  "/ask",
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const payload = askSchema.parse(req.body);
    const result = await aiService.ask(payload, req.user!.id);
    res.json(result);
  }),
);
