import { Request, Response, Router } from "express";
import multer from "multer";
import { authenticateToken } from "../authMiddleware";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

const RELAY_URL = process.env.RELAY_URL;
const RELAY_API_KEY = process.env.RELAY_API_KEY;

router.post(
  "/upload",
  authenticateToken,
  upload.single("file"),
  async (req: Request, res: Response) => {
    if (!req.file) {
      return res.status(400).json({ error: "No file provided" });
    }

    try {
      const formData = new FormData();
      const blob = new Blob([new Uint8Array(req.file.buffer)], {
        type: req.file.mimetype,
      });
      formData.append("file", blob, req.file.originalname);

      const headers: Record<string, string> = {};
      if (RELAY_API_KEY) headers["Authorization"] = `Bearer ${RELAY_API_KEY}`;

      const relayRes = await fetch(`${RELAY_URL}/api/files/upload`, {
        method: "POST",
        headers,
        body: formData,
      });

      const result = await relayRes.json();

      if (!result.success) {
        return res.status(502).json({ error: result.error ?? "Upload failed" });
      }

      res.status(201).json({ id: result.data.id });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  },
);

export default router;
