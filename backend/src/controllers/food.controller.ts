import { Request, Response } from "express";
import {
  advanceFoodStep,
  createOrGetFoodSession,
  resetFoodSession,
  stepBackFoodSession,
} from "../services/food.service.js";

export async function createOrGetSessionController(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { sessionId, initialOrder } = req.body || {};

    if (sessionId !== undefined && typeof sessionId !== "string") {
      res.status(400).json({ message: "sessionId must be a string." });
      return;
    }

    const response = createOrGetFoodSession(sessionId, initialOrder);
    res.status(200).json(response);
  } catch (error) {
    console.error("Error creating/getting food session:", error);
    res.status(500).json({ message: "Failed to process food session." });
  }
}

export async function advanceStepController(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { sessionId, data } = req.body || {};

    if (typeof sessionId !== "string" || sessionId.trim().length === 0) {
      res.status(400).json({ message: "sessionId is required." });
      return;
    }

    const response = advanceFoodStep(sessionId.trim(), data);
    res.status(200).json(response);
  } catch (error) {
    const errMessage = error instanceof Error ? error.message : "Failed to advance step.";
    if (errMessage.includes("not found")) {
      res.status(404).json({ message: errMessage });
      return;
    }
    console.error("Error advancing food step:", error);
    res.status(500).json({ message: errMessage });
  }
}

export async function backStepController(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { sessionId, targetStep } = req.body || {};

    if (typeof sessionId !== "string" || sessionId.trim().length === 0) {
      res.status(400).json({ message: "sessionId is required." });
      return;
    }

    const response = stepBackFoodSession(sessionId.trim(), targetStep);
    res.status(200).json(response);
  } catch (error) {
    const errMessage = error instanceof Error ? error.message : "Failed to step back.";
    if (errMessage.includes("not found")) {
      res.status(404).json({ message: errMessage });
      return;
    }
    console.error("Error stepping back in food session:", error);
    res.status(500).json({ message: errMessage });
  }
}

export async function resetSessionController(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { sessionId } = req.body || {};

    if (typeof sessionId !== "string" || sessionId.trim().length === 0) {
      res.status(400).json({ message: "sessionId is required." });
      return;
    }

    const response = resetFoodSession(sessionId.trim());
    res.status(200).json(response);
  } catch (error) {
    const errMessage = error instanceof Error ? error.message : "Failed to reset session.";
    if (errMessage.includes("not found")) {
      res.status(404).json({ message: errMessage });
      return;
    }
    console.error("Error resetting food session:", error);
    res.status(500).json({ message: errMessage });
  }
}
