const express = require("express");
const router = express.Router();
const { createSecret, getSecret } = require("../lib/crypto");

// Create a new secret
router.post("/", async (req, res) => {
  try {
    const { projectId, environmentId, name, value, type, signature, userId } =
      req.body;

    if (
      !projectId ||
      !environmentId ||
      !name ||
      !value ||
      !type ||
      !signature ||
      !userId
    ) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const secret = await createSecret(
      projectId,
      environmentId,
      name,
      value,
      type,
      signature,
      userId
    );

    res.status(201).json(secret);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get a secret
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { signature } = req.query;

    if (!signature) {
      return res.status(400).json({ error: "Signature is required" });
    }

    const secret = await getSecret(id, signature);
    res.json(secret);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
