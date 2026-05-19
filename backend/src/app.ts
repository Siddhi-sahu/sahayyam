import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env";
import { errorHandler, notFoundHandler } from "./middleware/error";
import { apiRouter } from "./routes";

export const app = express();

app.use(helmet());
app.use(
    cors({
        origin: env.CORS_ORIGIN,
        credentials: true,
    }),
    );
app.use(express.json({ limit: "1mb" }));
app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));

app.get("/health", (_req, res) => {
    res.json({
        ok: true,
        service: "sahayyam-api",
        timestamp: new Date().toISOString(),
    });
});

app.use("/api", apiRouter);
app.use(notFoundHandler);
app.use(errorHandler);
