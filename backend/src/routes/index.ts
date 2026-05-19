import { Router } from "express";
import { aiRouter } from "../modules/ai/ai.routes";
import { authRouter } from "../modules/auth/auth.routes";
import { nudgeRouter } from "../modules/nudges/nudge.routes";
import { tipRouter } from "../modules/tips/tip.routes";

export const apiRouter = Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/tips", tipRouter);
apiRouter.use("/nudges", nudgeRouter);
apiRouter.use("/ai", aiRouter);
