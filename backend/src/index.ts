import express from "express";
import dotenv from "dotenv";
import bookRoutes from "./routes/bookRoutes";
import cors from "cors";
import { checkOverdueLoans } from "./job/checkOverdueLoan";
import cron from "node-cron";
import authRoutes from "./routes/authRoutes";
import fineRoutes from "./routes/fineRoutes";
import loanRoutes from "./routes/loanRoutes";
import memberRoutes from "./routes/memberRoutes";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());
app.use("/auth", authRoutes);
app.use("/book", bookRoutes);
app.use("/fine", fineRoutes);
app.use("/loan", loanRoutes);
app.use("/member", memberRoutes);

app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.use(
  (
    err: Error,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  },
);

cron.schedule("0 0 * * *", () => {
  checkOverdueLoans();
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
