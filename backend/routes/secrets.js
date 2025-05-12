const express = require("express");
const router = express.Router();
const { createSecret, getSecret, shareSecret } = require("../lib/crypto");
const nacl = require("tweetnacl");
const { decryptWithAES } = require("../lib/crypto");

// Create a new secret
router.post("/", async (req, res) => {
  try {
    const { projectId, environmentId, name, value, type, walletAddress } =
      req.body;

    if (
      !projectId ||
      !environmentId ||
      !name ||
      !value ||
      !type ||
      !walletAddress
    ) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const secret = await createSecret(
      projectId,
      environmentId,
      name,
      value,
      type,
      walletAddress
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
    const { walletAddress, privateKey } = req.query;

    if (!walletAddress || !privateKey) {
      return res.status(400).json({
        error: "Wallet address and private key are required",
      });
    }

    const secret = await getSecret(id, walletAddress, privateKey);
    res.json(secret);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Share a secret with another user
router.post("/:id/share", async (req, res) => {
  try {
    const { id } = req.params;
    const { targetWalletAddress, creatorWalletAddress } = req.body;

    if (!targetWalletAddress || !creatorWalletAddress) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const result = await shareSecret(
      id,
      targetWalletAddress,
      creatorWalletAddress
    );
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Decrypt and show secret value
router.post("/:id/decrypt", async (req, res) => {
  try {
    const { id } = req.params;
    const { walletAddress, privateKey, signature } = req.body;

    if (!walletAddress || !privateKey || !signature) {
      return res.status(400).json({
        error: "Wallet address, private key, and signature are required",
      });
    }

    // Get the encrypted secret
    const secret = await getSecret(id, walletAddress, privateKey);

    // Verify the signature
    const message = Buffer.from("auth-to-decrypt");
    const isValid = nacl.sign.detached.verify(
      message,
      Buffer.from(signature, "base64"),
      Buffer.from(walletAddress, "base64")
    );

    if (!isValid) {
      return res.status(401).json({ error: "Invalid signature" });
    }

    // Decrypt the secret value
    const decryptedValue = decryptWithAES(
      secret.encrypted_value,
      Buffer.from(privateKey, "base64"),
      secret.iv,
      secret.auth_tag
    );

    res.json({
      id: secret.id,
      name: secret.name,
      value: decryptedValue,
      type: secret.type,
      created_at: secret.created_at,
      updated_at: secret.updated_at,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
