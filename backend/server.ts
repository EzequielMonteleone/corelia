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
import reservationRoutes, {
  buildingReservationRouter,
} from './routes/reservationRoutes.js';
import {
  periodRouter,
  expenseRouter,
  paymentRouter,
} from './routes/expenseRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import documentRoutes from './routes/documentRoutes.js';
import {
  memberRouter,
  petRouter,
  unitHouseholdRouter,
  vehicleRouter,
} from './routes/householdRoutes.js';

const requiredEnvVars = ['JWT_SECRET', 'DATABASE_URL'] as const;
for (const key of requiredEnvVars) {
  if (!process.env[key]) {
    console.error(`❌  Missing required env var: ${key}`);
    process.exit(1);
  }
}

const app = express();

app.use(helmet());
const configuredOrigin = process.env.CORS_ORIGIN ?? process.env.FRONTEND_URL;
const corsOrigin =
  configuredOrigin ??
  (process.env.NODE_ENV === 'production' ? false : 'http://localhost:3001');
app.use(
  cors({
    origin: corsOrigin,
    credentials: true,
  }),
);
app.use(express.json());

app.use('/auth', authRoutes);
app.use('/buildings', buildingRoutes);
app.use('/users', userRoutes);
app.use('/roles', roleRoutes);
app.use('/units', unitRoutes);
app.use('/units', unitHouseholdRouter);
app.use('/members', memberRouter);
app.use('/vehicles', vehicleRouter);
app.use('/pets', petRouter);
app.use('/amenities', amenityRoutes);
app.use('/buildings', buildingReservationRouter);
app.use('/reservations', reservationRoutes);
app.use('/expense-periods', periodRouter);
app.use('/expenses', expenseRouter);
app.use('/payments', paymentRouter);
app.use('/chat', chatRoutes);
app.use('/buildings/:buildingId/documents', documentRoutes);
app.use(meRoutes);

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({error: 'INTERNAL_SERVER_ERROR'});
});

const PORT = process.env.PORT;

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
