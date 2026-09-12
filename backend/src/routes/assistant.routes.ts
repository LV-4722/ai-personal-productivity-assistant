import { Router } from "express";
import { handleAssistantMessageController } from "../controllers/assistant.controller.js";

const router = Router();

router.post("/", handleAssistantMessageController);

export default router;
