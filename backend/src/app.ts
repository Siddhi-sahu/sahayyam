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
        origin(origin, callback) {
        const normalizeOrigin = (value: string) => value.trim().replace(/\/$/, "");
        const configuredOrigins = env.CORS_ORIGIN.split(",").map(normalizeOrigin);
        const localDevOrigins = ["http://localhost:5173", "http://127.0.0.1:5173"];
        const requestOrigin = origin ? normalizeOrigin(origin) : null;
        if (!requestOrigin || configuredOrigins.includes(requestOrigin) || localDevOrigins.includes(requestOrigin)) {
            callback(null, true);
            return;
        }
        callback(null, false);
        },
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
