import { Request, Response } from "express";
import { handleAssistantMessage } from "../services/assistant.service.js";

export async function handleAssistantMessageController(
  req: Request,
  res: Response,
): Promise<void> {
  const { message, sessionId } = req.body;

  if (typeof message !== "string" || message.trim().length === 0) {
    res.status(400).json({
      message: "Message is required",
    });
    return;
  }

  try {
    const result = await handleAssistantMessage(
      message,
      typeof sessionId === "string" ? sessionId : undefined,
    );

    res.status(200).json(result);
  } catch (error) {
    console.error("Error handling assistant message:", error);

    res.status(500).json({
      message: "Failed to process assistant message",
    });
  }
}
