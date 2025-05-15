const express = require("express");
const router = express.Router();
const {
  createSecret,
  getSecret,
  shareSecret,
  decryptWithAES,
  decryptAESKeyForUser
} = require("../lib/crypto");
const nacl = require("tweetnacl");
const { PublicKey } = require("@solana/web3.js");
const { supabase } = require("../lib/supabase");
const crypto = require("crypto");
const bs58 = require("bs58");

// Get all secrets for a wallet
router.get("/", async (req, res) => {
  try {
    const { walletAddress, signature } = req.query;

    if (!walletAddress) {
      return res.status(400).json({
        error: "Wallet address is required",
      });
    }

    // Find all secret_keys associated with this wallet
    const { data: secretKeys, error: secretKeysError } = await supabase
      .from("secret_keys")
      .select("secret_id")
      .eq("wallet_address", walletAddress);

    if (secretKeysError) {
      console.error("Error fetching secret keys:", secretKeysError);
      throw secretKeysError;
    }

    if (!secretKeys || secretKeys.length === 0) {
      return res.json({ secrets: [] });
    }

    // Get the secret IDs
    const secretIds = secretKeys.map(key => key.secret_id);

    // Get all secrets details
    const { data: secrets, error: secretsError } = await supabase
      .from("secrets")
      .select("id, name, type, project_id, environment_id")
      .in("id", secretIds);

    if (secretsError) {
      console.error("Error fetching secrets:", secretsError);
      throw secretsError;
    }

    // Get project info for each secret
    const projectIds = [...new Set(secrets.map(s => s.project_id))];
    const { data: projects, error: projectsError } = await supabase
      .from("projects")
      .select("id, name")
      .in("id", projectIds);

    if (projectsError) {
      console.error("Error fetching projects:", projectsError);
      throw projectsError;
    }

    // Map project names to secrets
    const projectMap = {};
    if (projects) {
      projects.forEach(p => {
        projectMap[p.id] = p.name;
      });
    }

    // Get environment info for each secret
    const envIds = [...new Set(secrets.map(s => s.environment_id))];
    const { data: environments, error: envsError } = await supabase
      .from("environments")
      .select("id, name")
      .in("id", envIds);

    if (envsError) {
      console.error("Error fetching environments:", envsError);
      throw envsError;
    }

    // Map environment names to secrets
    const envMap = {};
    if (environments) {
      environments.forEach(e => {
        envMap[e.id] = e.name;
      });
    }

    // Combine all data
    const secretsWithDetails = secrets.map(secret => ({
      id: secret.id,
      name: secret.name,
      type: secret.type,
      projectName: projectMap[secret.project_id] || "Unknown Project",
      environmentName: envMap[secret.environment_id] || "Unknown Environment"
    }));

    res.json({ secrets: secretsWithDetails });
  } catch (error) {
    console.error("Error in get all secrets:", error);
    res.status(500).json({ error: error.message });
  }
});

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

    console.log("========= DECRYPTION PROCESS BEGIN =========");
    console.log("Received decrypt request:", {
      id,
      walletAddress,
      signatureLength: signature?.length,
    });

    // Input validation
    if (!id) {
      return res.status(400).json({ error: "Secret ID is required" });
    }

    if (!walletAddress) {
      return res.status(400).json({ error: "Wallet address is required" });
    }

    if (!signature) {
      return res.status(400).json({ error: "Signature is required" });
    }

    // Step 1: Get the encrypted secret data
    console.log("\n========= STEP 1: FETCH SECRET =========");
    let secret;
    try {
      secret = await getSecret(id, walletAddress);
      console.log("Secret data retrieved:", {
        id: secret.id,
        name: secret.name,
        hasEncryptedValue: !!secret.encrypted_value,
        ivLength: secret.iv?.length,
        authTagLength: secret.auth_tag?.length,
        // Also includes encrypted AES key data:
        hasEncryptedAESKey: !!secret.encrypted_aes_key,
        hasNonce: !!secret.nonce,
        hasEphemeralPublicKey: !!secret.ephemeral_public_key,
      });
    } catch (error) {
      console.error("Failed to get secret data:", error);
      return res.status(404).json({ 
        error: `Secret retrieval failed: ${error.message}`,
        step: "database_fetch"
      });
    }

    // Step 2: Verify the signature
    console.log("\n========= STEP 2: VERIFY SIGNATURE =========");
    try {
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

      console.log("Verifying signature with:", {
        messageLength: messageBytes.length,
        signatureBytesLength: signatureBytes.length,
        publicKeyBytesLength: publicKeyBytes.length,
      });

      const isValid = nacl.sign.detached.verify(
        messageBytes,
        signatureBytes,
        publicKeyBytes
      );

      console.log("Signature verification result:", isValid);

      if (!isValid) {
        return res.status(401).json({ 
          error: "Invalid signature - Could not verify with your wallet's public key",
          step: "signature_verification" 
        });
      }
    } catch (error) {
      console.error("Signature verification error:", {
        error: error.message,
        stack: error.stack,
        walletAddress,
        signatureLength: signature?.length,
      });
      return res.status(401).json({ 
        error: `Invalid signature format: ${error.message}`,
        step: "signature_verification"
      });
    }

    // Step 3: Get the user's encrypted AES key
    console.log("\n========= STEP 3: GET ENCRYPTED AES KEY =========");
    console.log("Retrieving encrypted AES key information:");
    console.log({
      hasEncryptedAESKey: !!secret.encrypted_aes_key,
      hasNonce: !!secret.nonce,
      hasEphemeralPublicKey: !!secret.ephemeral_public_key
    });

    // Step 4: Derive private key from signature
    console.log("\n========= STEP 4: DERIVE PRIVATE KEY FROM SIGNATURE =========");
    let userPrivateKey;
    try {
      // This is a simplified approach - in production, you should use a secure method
      // to get the private key that doesn't expose it in transit
      const signatureBytes = Uint8Array.from(Buffer.from(signature, "base64"));
      const messageBytes = Uint8Array.from(Buffer.from("auth-to-decrypt"));
      
      // Use signature as a source of entropy to derive a key for demo purposes
      // In production, this should be replaced with proper key management
      const privateKeyHash = crypto.createHash('sha256')
        .update(Buffer.from([...messageBytes, ...signatureBytes]))
        .digest();
      
      userPrivateKey = bs58.encode(privateKeyHash);
      
      console.log("Derived key for AES key decryption:", {
        privateKeyType: typeof userPrivateKey,
        privateKeyLength: userPrivateKey.length,
        privateKeyPrefix: userPrivateKey.substring(0, 8) + '...'
      });
    } catch (error) {
      console.error("Private key derivation error:", error);
      return res.status(500).json({ 
        error: `Failed to derive private key: ${error.message}`,
        step: "private_key_derivation"
      });
    }

    // Step 5: Decrypt the AES key
    console.log("\n========= STEP 5: DECRYPT AES KEY =========");
    let decryptedAESKey;
    try {
      // Decrypt the AES key using box.open with the user's private key
      decryptedAESKey = decryptAESKeyForUser(
        secret.encrypted_aes_key,
        secret.nonce,
        secret.ephemeral_public_key,
        userPrivateKey
      );
      
      console.log("AES key decrypted successfully:", {
        keyLength: decryptedAESKey.length,
        keyType: typeof decryptedAESKey,
        isBuffer: Buffer.isBuffer(decryptedAESKey)
      });
    } catch (error) {
      console.error("AES key decryption error:", error);
      return res.status(500).json({ 
        error: `Failed to decrypt AES key: ${error.message}`,
        step: "aes_key_decryption"
      });
    }

    // Step 6: Validate decryption inputs
    console.log("\n========= STEP 6: VALIDATE DECRYPTION INPUTS =========");
    try {
      if (!secret.encrypted_value) {
        throw new Error("Missing encrypted value");
      }
      
      const iv = Buffer.from(secret.iv, "hex");
      if (iv.length !== 16) {
        throw new Error(`Invalid IV length: ${iv.length} (expected 16)`);
      }
      
      const authTag = Buffer.from(secret.auth_tag, "hex");
      if (authTag.length === 0) {
        throw new Error("Missing authentication tag");
      }
      
      console.log("Decryption inputs validated:", {
        encryptedValueLength: secret.encrypted_value.length,
        encryptedValuePrefix: secret.encrypted_value.substring(0, 20) + '...',
        iv: secret.iv,
        ivLength: iv.length,
        authTag: secret.auth_tag,
        authTagLength: authTag.length
      });
    } catch (error) {
      console.error("Input validation error:", error);
      return res.status(400).json({ 
        error: `Decryption input validation failed: ${error.message}`,
        step: "input_validation"
      });
    }

    // Step 7: Decrypt the secret value
    console.log("\n========= STEP 7: DECRYPT DATA WITH AES =========");
    let decryptedValue;
    try {
      console.log("Calling decryptWithAES with:", {
        encryptedDataLength: secret.encrypted_value.length,
        keyLength: decryptedAESKey.length, 
        ivLength: Buffer.from(secret.iv, "hex").length,
        authTagLength: Buffer.from(secret.auth_tag, "hex").length
      });
      
      decryptedValue = decryptWithAES(
        secret.encrypted_value,
        decryptedAESKey,  // Using properly decrypted AES key instead of derived key
        Buffer.from(secret.iv, "hex"),
        Buffer.from(secret.auth_tag, "hex")
      );
      
      console.log("Decryption successful:", {
        decryptedLength: decryptedValue.length,
        decryptedPrefix: decryptedValue.substring(0, 20) + (decryptedValue.length > 20 ? '...' : '')
      });
    } catch (error) {
      console.error("Decryption error:", error);
      return res.status(500).json({ 
        error: `Decryption failed: ${error.message}`,
        step: "decryption",
        details: {
          aesKeyLength: decryptedAESKey.length,
          encryptedValuePrefix: secret.encrypted_value.substring(0, 20) + '...',
          ivLength: Buffer.from(secret.iv, "hex").length,
          authTagLength: Buffer.from(secret.auth_tag, "hex").length
        }
      });
    }

    console.log("========= DECRYPTION PROCESS COMPLETE =========");
    
    // Return the decrypted secret
    res.json({
      id: secret.id,
      name: secret.name,
      value: decryptedValue,
      type: secret.type,
      created_at: secret.created_at,
      updated_at: secret.updated_at,
    });
  } catch (error) {
    console.error("Decrypt endpoint error:", error);
    res.status(500).json({ 
      error: `Decryption process failed: ${error.message}`,
      step: "unknown"
    });
  }
});

// Diagnostic endpoint for encryption testing
router.post("/:id/diagnostic", async (req, res) => {
  try {
    const { id } = req.params;
    const { walletAddress, signature } = req.body;

    console.log("========= DIAGNOSTIC PROCESS BEGIN =========");
    console.log("Received diagnostic request:", {
      id,
      walletAddress,
      signatureLength: signature?.length,
    });

    // Input validation
    if (!id || !walletAddress || !signature) {
      return res.status(400).json({ error: "Missing required parameters" });
    }

    // Step 1: Get the encrypted secret data
    console.log("\n========= STEP 1: FETCH SECRET =========");
    let secret;
    try {
      secret = await getSecret(id, walletAddress);
      console.log("Secret data retrieved:", {
        id: secret.id,
        name: secret.name,
        hasEncryptedValue: !!secret.encrypted_value,
        encryptedValueLength: secret.encrypted_value?.length,
        ivLength: secret.iv?.length,
        authTagLength: secret.auth_tag?.length,
        hasEncryptedAESKey: !!secret.encrypted_aes_key,
        encryptedAESKeyLength: secret.encrypted_aes_key?.length,
        hasNonce: !!secret.nonce,
        nonceLength: secret.nonce?.length,
        hasEphemeralPublicKey: !!secret.ephemeral_public_key,
        ephemeralPublicKeyLength: secret.ephemeral_public_key?.length,
      });
    } catch (error) {
      console.error("Failed to get secret data:", error);
      return res.status(404).json({ 
        error: `Secret retrieval failed: ${error.message}`,
        step: "database_fetch"
      });
    }

    // Step 2: Verify the signature
    console.log("\n========= STEP 2: VERIFY SIGNATURE =========");
    try {
      const message = Buffer.from("auth-to-decrypt");
      const publicKey = new PublicKey(walletAddress);
      const publicKeyBytes = publicKey.toBytes();
      const signatureBytes = Uint8Array.from(Buffer.from(signature, "base64"));
      const messageBytes = Uint8Array.from(message);

      const isValid = nacl.sign.detached.verify(
        messageBytes,
        signatureBytes,
        publicKeyBytes
      );

      console.log("Signature verification result:", isValid);
      if (!isValid) {
        return res.status(401).json({ 
          error: "Invalid signature",
          step: "signature_verification" 
        });
      }
    } catch (error) {
      return res.status(401).json({ 
        error: `Signature verification error: ${error.message}`,
        step: "signature_verification"
      });
    }

    // Step 3: Derive private key from signature (for demonstration only)
    console.log("\n========= STEP 3: DERIVE PRIVATE KEY =========");
    let userPrivateKey;
    try {
      const signatureBytes = Uint8Array.from(Buffer.from(signature, "base64"));
      const messageBytes = Uint8Array.from(Buffer.from("auth-to-decrypt"));
      
      // Use signature as entropy source (DEMO ONLY - NOT SECURE FOR PRODUCTION)
      const privateKeyHash = crypto.createHash('sha256')
        .update(Buffer.from([...messageBytes, ...signatureBytes]))
        .digest();
      
      userPrivateKey = bs58.encode(privateKeyHash);
      
      console.log("Derived private key:", {
        type: typeof userPrivateKey,
        length: userPrivateKey.length,
        prefix: userPrivateKey.substring(0, 8) + '...'
      });
    } catch (error) {
      return res.status(500).json({ 
        error: `Private key derivation error: ${error.message}`,
        step: "private_key_derivation"
      });
    }

    return res.json({
      message: "Diagnostic successful",
      secretInfo: {
        id: secret.id,
        name: secret.name,
        encryptedValueLength: secret.encrypted_value?.length || 0,
        encryptedAESKeyLength: secret.encrypted_aes_key?.length || 0,
        ivLength: Buffer.from(secret.iv || "", "hex").length,
        authTagLength: Buffer.from(secret.auth_tag || "", "hex").length,
        nonceLength: secret.nonce?.length || 0,
        ephemeralPublicKeyLength: secret.ephemeral_public_key?.length || 0,
      },
      signatureVerified: true,
      privateKeyDerivationSuccessful: !!userPrivateKey
    });
  } catch (error) {
    console.error("Diagnostic error:", error);
    res.status(500).json({ 
      error: `Diagnostic failed: ${error.message}`,
      step: "unknown"
    });
  }
});

module.exports = router;
