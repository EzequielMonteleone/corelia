import "dotenv/config";
import express from "express";
import type { Request, Response, NextFunction } from "express";
import authRoutes from "./routes/authRoutes.js";
import meRoutes from "./routes/meRoutes.js";
import userRoutes from "./routes/userRoutes.js";

const requiredEnvVars = ["JWT_SECRET", "DATABASE_URL"] as const;
for (const key of requiredEnvVars) {
  if (!process.env[key]) {
    console.error(`❌  Missing required env var: ${key}`);
    process.exit(1);
  }
}

const app = express();

app.use(express.json());

app.use("/auth", authRoutes);
app.use("/buildings", userRoutes);
app.use(meRoutes);

app.use(
  (err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    console.error(err);
    res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
  }
);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

