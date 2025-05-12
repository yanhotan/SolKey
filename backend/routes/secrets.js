const express = require("express");
const router = express.Router();
const {
  createSecret,
  getSecret,
  shareSecret,
  decryptWithAES,
} = require("../lib/crypto");
const nacl = require("tweetnacl");
const { PublicKey } = require("@solana/web3.js");
const { supabase } = require("../lib/supabase");
const crypto = require("crypto");

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
    const { walletAddress, signature } = req.body;

    console.log("Received request:", {
      id,
      walletAddress,
      signatureLength: signature?.length,
    });

    if (!walletAddress || !signature) {
      return res.status(400).json({
        error: "Wallet address and signature are required",
      });
    }

    // Get the encrypted secret
    const secret = await getSecret(id, walletAddress);

    try {
      // Verify the signature
      const message = Buffer.from("auth-to-decrypt");
      console.log("Message to verify:", message.toString());

      // Convert wallet address to public key bytes using Solana's PublicKey
      const publicKey = new PublicKey(walletAddress);
      const publicKeyBytes = publicKey.toBytes();
      console.log("Public key bytes length:", publicKeyBytes.length);

      // Convert signature from base64 to Uint8Array
      const signatureBytes = Uint8Array.from(Buffer.from(signature, "base64"));
      console.log("Signature bytes length:", signatureBytes.length);

      // Convert message to Uint8Array
      const messageBytes = Uint8Array.from(message);

      const isValid = nacl.sign.detached.verify(
        messageBytes,
        signatureBytes,
        publicKeyBytes
      );

      console.log("Signature verification result:", isValid);

      if (!isValid) {
        return res.status(401).json({ error: "Invalid signature" });
      }
    } catch (error) {
      console.error("Signature verification error:", {
        error: error.message,
        stack: error.stack,
        walletAddress,
        signatureLength: signature?.length,
      });
      return res.status(401).json({ error: "Invalid signature format" });
    }

    // Get the user's encrypted AES key
    const { data: keyData, error: keyError } = await supabase
      .from("secret_keys")
      .select("*")
      .eq("secret_id", id)
      .eq("wallet_address", walletAddress)
      .single();

    if (keyError) {
      return res.status(401).json({ error: "Unauthorized access" });
    }

    // Use the signature to derive a key for decryption
    const signatureBytes = Uint8Array.from(Buffer.from(signature, "base64"));
    const messageBytes = Uint8Array.from(Buffer.from("auth-to-decrypt"));
    const combinedBytes = new Uint8Array([...messageBytes, ...signatureBytes]);

    // Use PBKDF2 to derive a 32-byte key
    const derivedKey = crypto.pbkdf2Sync(
      combinedBytes,
      "solkey-salt-v1",
      310000, // High iteration count for security
      32, // 32 bytes = 256 bits for AES-256
      "sha256"
    );

    // Decrypt the secret value using the derived key
    const decryptedValue = decryptWithAES(
      secret.encrypted_value,
      derivedKey,
      Buffer.from(secret.iv, "hex"),
      Buffer.from(secret.auth_tag, "hex")
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
    console.error("Decrypt error:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
