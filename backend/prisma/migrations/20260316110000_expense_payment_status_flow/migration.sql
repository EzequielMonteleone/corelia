-- Add REJECTED to PaymentStatus
ALTER TYPE "PaymentStatus" ADD VALUE 'REJECTED';

-- ExpenseStatus: replace PARTIAL with UNPAID, default UNPAID
CREATE TYPE "ExpenseStatus_new" AS ENUM ('UNPAID', 'PENDING', 'PAID');

ALTER TABLE "Expense" ADD COLUMN "status_new" "ExpenseStatus_new";

UPDATE "Expense" SET status_new = CASE
  WHEN status::text = 'PAID' THEN 'PAID'::"ExpenseStatus_new"
  WHEN status::text = 'PARTIAL' AND EXISTS (SELECT 1 FROM "Payment" p WHERE p."expenseId" = "Expense".id AND p.status = 'PENDING') THEN 'PENDING'::"ExpenseStatus_new"
  WHEN status::text = 'PARTIAL' THEN 'UNPAID'::"ExpenseStatus_new"
  ELSE 'PENDING'::"ExpenseStatus_new"
END;

ALTER TABLE "Expense" ALTER COLUMN "status_new" SET NOT NULL;
ALTER TABLE "Expense" DROP COLUMN "status";
ALTER TABLE "Expense" RENAME COLUMN "status_new" TO "status";
ALTER TABLE "Expense" ALTER COLUMN "status" SET DEFAULT 'UNPAID';

DROP TYPE "ExpenseStatus";
ALTER TYPE "ExpenseStatus_new" RENAME TO "ExpenseStatus";
