import { Router } from "express";
import { asyncHandler } from "../../lib/http";
import { requireAuth, requireRole, type AuthedRequest } from "../../middleware/auth";
import { verificationSchema } from "../verifications/verification.schemas";
import * as verificationService from "../verifications/verification.service";
import { createTipSchema, feedQuerySchema } from "./tip.schemas";
import * as tipService from "./tip.service";

export const tipRouter = Router();

function routeParam(value: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

tipRouter.post(
  "/",
  requireAuth,
  requireRole("SENIOR", "ADMIN"),
  asyncHandler(async (req: AuthedRequest, res) => {
    const payload = createTipSchema.parse(req.body);
    const tip = await tipService.createTip(payload, req.user!.id);
    res.status(201).json({ tip });
  }),
);

tipRouter.get(
  "/feed",
  requireAuth,
  asyncHandler(async (req: AuthedRequest, res) => {
    const query = feedQuerySchema.parse(req.query);
    const tips = await tipService.getFeed(query, req.user!.id);
    res.json({ tips });
  }),
);

tipRouter.get(
  "/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const tip = await tipService.getTip(routeParam(req.params.id));
    res.json({ tip });
  }),
);

tipRouter.post(
  "/:id/verify",
  requireAuth,
  requireRole("SENIOR", "ADMIN"),
  asyncHandler(async (req: AuthedRequest, res) => {
    const payload = verificationSchema.parse(req.body);
    const tip = await verificationService.verifyTip(routeParam(req.params.id), req.user!.id, payload);
    res.json({ tip });
  }),
);

tipRouter.post(
  "/:id/dispute",
  requireAuth,
  requireRole("SENIOR", "ADMIN"),
  asyncHandler(async (req: AuthedRequest, res) => {
    const payload = verificationSchema.parse(req.body);
    const tip = await verificationService.disputeTip(routeParam(req.params.id), req.user!.id, payload);
    res.json({ tip });
  }),
);
