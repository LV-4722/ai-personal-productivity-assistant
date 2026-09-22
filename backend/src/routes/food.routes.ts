import { Router } from "express";
import {
  advanceStepController,
  backStepController,
  createOrGetSessionController,
  resetSessionController,
} from "../controllers/food.controller.js";

const router = Router();

router.post("/session", createOrGetSessionController);
router.post("/step", advanceStepController);
router.post("/back", backStepController);
router.post("/reset", resetSessionController);

export default router;
