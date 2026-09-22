import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { testDatabaseConnection } from "./db.js";
import assistantRouter from "./routes/assistant.routes.js";
import taskRouter from "./routes/task.routes.js";
import foodRouter from "./routes/food.routes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({
    success: true,
    message: "AI Personal Productivity Assistant backend is running",
  });
});

app.use("/tasks", taskRouter);
app.use("/assistant", assistantRouter);
app.use("/food", foodRouter);

async function startServer(): Promise<void> {
  try {
    await testDatabaseConnection();

    app.listen(PORT, () => {
      console.log(`Backend server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to connect to PostgreSQL:", error);
    process.exit(1);
  }
}

startServer();
