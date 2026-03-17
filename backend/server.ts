import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import type {Request, Response, NextFunction} from 'express';
import authRoutes from './routes/authRoutes.js';
import meRoutes from './routes/meRoutes.js';
import buildingRoutes from './routes/buildingRoutes.js';
import userRoutes from './routes/userRoutes.js';
import roleRoutes from './routes/roleRoutes.js';
import unitRoutes from './routes/unitRoutes.js';
import amenityRoutes from './routes/amenityRoutes.js';
import {periodRouter, expenseRouter, paymentRouter} from './routes/expenseRoutes.js';

const requiredEnvVars = ['JWT_SECRET', 'DATABASE_URL'] as const;
for (const key of requiredEnvVars) {
  if (!process.env[key]) {
    console.error(`❌  Missing required env var: ${key}`);
    process.exit(1);
  }
}

const app = express();

app.use(helmet());
app.use(
  cors({
    origin:
      process.env.CORS_ORIGIN ?? process.env.FRONTEND_URL ?? true,
    credentials: true,
  }),
);
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/buildings', buildingRoutes);
app.use('/users', userRoutes);
app.use('/roles', roleRoutes);
app.use('/units', unitRoutes);
app.use('/amenities', amenityRoutes);
app.use('/expense-periods', periodRouter);
app.use('/expenses', expenseRouter);
app.use('/payments', paymentRouter);
app.use(meRoutes);

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({error: 'INTERNAL_SERVER_ERROR'});
});

const PORT = process.env.PORT;

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
