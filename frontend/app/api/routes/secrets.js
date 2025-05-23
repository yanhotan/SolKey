const express = require("express");
const router = express.Router();
const {
  createSecret,
  getSecret,
  shareSecret,
  decryptWithAES,
  decryptAESKeyForUser,
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
    const secretIds = secretKeys.map((key) => key.secret_id);

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
    const projectIds = [...new Set(secrets.map((s) => s.project_id))];
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
      projects.forEach((p) => {
        projectMap[p.id] = p.name;
      });
    }

    // Get environment info for each secret
    const envIds = [...new Set(secrets.map((s) => s.environment_id))];
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
      environments.forEach((e) => {
        envMap[e.id] = e.name;
      });
    }

    // Combine all data
    const secretsWithDetails = secrets.map((secret) => ({
      id: secret.id,
      name: secret.name,
      type: secret.type,
      projectName: projectMap[secret.project_id] || "Unknown Project",
      environmentName: envMap[secret.environment_id] || "Unknown Environment",
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
    const {
      name,
      type,
      encrypted_value,
      iv,
      project_id,
      environment_id,
      wallet_address,
      encrypted_aes_key,
      nonce,
      ephemeral_public_key,
    } = req.body;

    // Validate required fields
    if (
      !name ||
      !type ||
      !encrypted_value ||
      !iv ||
      !wallet_address ||
      !project_id ||
      !environment_id
    ) {
      return res.status(400).json({
        error: "Missing required fields",
        required:
          "name, type, encrypted_value, iv, wallet_address, project_id, environment_id",
      });
    }

    console.log(`Creating secret '${name}' for wallet ${wallet_address}`, {
      type,
      project_id,
      environment_id,
    });

    // The data is already encrypted by the frontend, so we just store it
    const { data: secret, error: secretError } = await supabase
      .from("secrets")
      .insert([
        {
          project_id,
          environment_id,
          name,
          encrypted_value,
          type,
          iv,
        },
      ])
      .select()
      .single();

    if (secretError) {
      console.error("Error creating secret:", secretError);
      throw secretError;
    }

    console.log(`Secret created with ID: ${secret.id}`);

    // Create a record in secret_keys to track access
    const { error: keyError } = await supabase.from("secret_keys").insert([
      {
        secret_id: secret.id,
        wallet_address,
        encrypted_aes_key: encrypted_aes_key || "frontend-encrypted",
        nonce: nonce || "frontend-encrypted",
        ephemeral_public_key: ephemeral_public_key || "frontend-encrypted",
      },
    ]);

    if (keyError) {
      console.error("Error creating secret_key access:", keyError);
      throw keyError;
    }

    res.status(201).json({
      id: secret.id,
      name: secret.name,
      type: secret.type,
      project_id: secret.project_id,
      environment_id: secret.environment_id,
    });
  } catch (error) {
    console.error("Error creating secret:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get secrets by project and environment ID (no wallet required)
router.get("/by-project", async (req, res) => {
  try {
    const { project_id, environment_id } = req.query;
    console.log("Received request to /by-project with params:", {
      project_id,
      environment_id,
    });

    if (!project_id) {
      console.log("Missing required parameter: project_id");
      return res.status(400).json({
        error: "Project ID is required",
      });
    }

    // Handle comma-separated environment IDs
    const environmentIds = environment_id
      ? environment_id.split(",").map((id) => id.trim())
      : [];

    console.log(
      "Fetching secrets for project:",
      project_id,
      "environments:",
      environmentIds
    );

    // Build the query
    let query = supabase
      .from("secrets")
      .select("*")
      .eq("project_id", project_id);

    // Add environment filter if environment IDs are provided
    if (environmentIds.length > 0) {
      query = query.in("environment_id", environmentIds);
    }

    // Execute the query
    const { data: secrets, error: secretsError } = await query;

    if (secretsError) {
      console.error("Error fetching secrets:", secretsError);
      throw secretsError;
    }

    console.log(`Found ${secrets?.length || 0} secrets`);

    // Return the secrets with encrypted values
    res.json({
      secrets: secrets.map((secret) => ({
        id: secret.id,
        name: secret.name,
        type: secret.type,
        encrypted_value: secret.encrypted_value,
        iv: secret.iv,
        project_id: secret.project_id,
        environment_id: secret.environment_id,
      })),
    });
  } catch (error) {
    console.error("Error in get secrets by project:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get a secret
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { walletAddress } = req.query;

    if (!walletAddress) {
      return res.status(400).json({
        error: "Wallet address is required",
      });
    }

    // Check if user has access to this secret
    const { data: secretKey, error: secretKeyError } = await supabase
      .from("secret_keys")
      .select("*")
      .eq("secret_id", id)
      .eq("wallet_address", walletAddress)
      .single();

    if (secretKeyError) {
      if (secretKeyError.code === "PGRST116") {
        return res
          .status(403)
          .json({ error: "You don't have access to this secret" });
      }
      throw secretKeyError;
    }

    // Get the actual secret data
    const { data: secret, error: secretError } = await supabase
      .from("secrets")
      .select("*")
      .eq("id", id)
      .single();

    if (secretError) {
      throw secretError;
    }

    // Return data for client-side decryption
    res.json({
      id: secret.id,
      name: secret.name,
      encrypted_value: secret.encrypted_value,
      iv: secret.iv,
      type: secret.type,
      project_id: secret.project_id,
      environment_id: secret.environment_id,
      encrypted_aes_key: secretKey.encrypted_aes_key,
      nonce: secretKey.nonce,
      ephemeral_public_key: secretKey.ephemeral_public_key,
    });
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

    // Input validation
    if (!id || !walletAddress || !signature) {
      return res.status(400).json({ error: "Missing required parameters" });
    }

    console.log(`Processing decrypt request for secret ${id}`, {
      walletAddress,
      signatureLength: signature?.length || 0,
    });

    // Step 1: Verify signature to authenticate the user
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

      if (!isValid) {
        console.error("Invalid signature provided for wallet", walletAddress);
        return res.status(401).json({ error: "Invalid signature" });
      }

      console.log("Signature verified successfully");
    } catch (error) {
      console.error("Signature verification error:", error);
      return res
        .status(401)
        .json({ error: `Signature verification error: ${error.message}` });
    }

    // Step 2: Check if user has access to this secret (has an encrypted key)
    console.log("Checking user access rights to secret");
    const { data: secretKey, error: secretKeyError } = await supabase
      .from("secret_keys")
      .select("*")
      .eq("secret_id", id)
      .eq("wallet_address", walletAddress)
      .single();

    if (secretKeyError) {
      console.error("Error fetching secret key access:", secretKeyError);
      if (secretKeyError.code === "PGRST116") {
        return res
          .status(403)
          .json({ error: "You don't have access to this secret" });
      }
      throw secretKeyError;
    }

    if (!secretKey) {
      return res.status(403).json({ error: "No access to this secret" });
    }

    // Step 3: Get the actual secret data
    console.log("Fetching secret data");
    const { data: secret, error: secretError } = await supabase
      .from("secrets")
      .select("*")
      .eq("id", id)
      .single();

    if (secretError) {
      console.error("Error fetching secret:", secretError);
      throw secretError;
    }

    // Step 4: Return the encrypted data for client-side decryption
    return res.json({
      // Secret data
      encrypted_value: secret.encrypted_value,
      iv: secret.iv,
      name: secret.name,
      type: secret.type,

      // Key data
      encrypted_aes_key: secretKey.encrypted_aes_key,
      nonce: secretKey.nonce,
      ephemeral_public_key: secretKey.ephemeral_public_key,
    });
  } catch (error) {
    console.error("Error processing decrypt request:", error);
    return res.status(500).json({ error: error.message });
  }
});

// Endpoint to just fetch encrypted data (without attempting decryption)
router.post("/:id/fetchEncrypted", async (req, res) => {
  try {
    const { id } = req.params;
    const { walletAddress } = req.body;

    // Input validation
    if (!id || !walletAddress) {
      return res.status(400).json({ error: "Missing required parameters" });
    }

    console.log(`Fetching encrypted data for secret ${id}`);

    // Signature is no longer required for fetching encrypted data
    // We only need to check if the wallet has access to this secret

    // Step 2: Check if user has access to this secret
    const { data: secretKey, error: secretKeyError } = await supabase
      .from("secret_keys")
      .select("*")
      .eq("secret_id", id)
      .eq("wallet_address", walletAddress)
      .single();

    if (secretKeyError) {
      if (secretKeyError.code === "PGRST116") {
        return res
          .status(403)
          .json({ error: "You don't have access to this secret" });
      }
      throw secretKeyError;
    }

    // Step 3: Get the actual secret data
    const { data: secret, error: secretError } = await supabase
      .from("secrets")
      .select("*")
      .eq("id", id)
      .single();

    if (secretError) {
      throw secretError;
    }

    // Return both the secret and the key info
    return res.json({
      id: secret.id,
      name: secret.name,
      encrypted_value: secret.encrypted_value,
      iv: secret.iv,
      type: secret.type,
      project_id: secret.project_id,
      environment_id: secret.environment_id,
      encrypted_aes_key: secretKey.encrypted_aes_key,
      nonce: secretKey.nonce,
      ephemeral_public_key: secretKey.ephemeral_public_key,
    });
  } catch (error) {
    console.error("Error fetching encrypted data:", error);
    return res.status(500).json({ error: error.message });
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
    let secret, secretKey;
    try {
      // Get the secret data
      const { data: secretData, error: secretError } = await supabase
        .from("secrets")
        .select("*")
        .eq("id", id)
        .single();

      if (secretError) throw secretError;
      secret = secretData;

      // Get the secret key for this user
      const { data: secretKeyData, error: secretKeyError } = await supabase
        .from("secret_keys")
        .select("*")
        .eq("secret_id", id)
        .eq("wallet_address", walletAddress)
        .single();

      if (secretKeyError) throw secretKeyError;
      secretKey = secretKeyData;

      console.log("Secret data retrieved:", {
        id: secret.id,
        name: secret.name,
        hasEncryptedValue: !!secret.encrypted_value,
        encryptedValueLength: secret.encrypted_value?.length,
        ivLength: secret.iv?.length,
        hasEncryptedAESKey: !!secretKey.encrypted_aes_key,
        encryptedAESKeyLength: secretKey.encrypted_aes_key?.length,
        hasNonce: !!secretKey.nonce,
        nonceLength: secretKey.nonce?.length,
        hasEphemeralPublicKey: !!secretKey.ephemeral_public_key,
        ephemeralPublicKeyLength: secretKey.ephemeral_public_key?.length,
      });
    } catch (error) {
      console.error("Failed to get secret data:", error);
      return res.status(404).json({
        error: `Secret retrieval failed: ${error.message}`,
        step: "database_fetch",
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
          step: "signature_verification",
        });
      }
    } catch (error) {
      return res.status(401).json({
        error: `Signature verification error: ${error.message}`,
        step: "signature_verification",
      });
    }

    return res.json({
      message:
        "Diagnostic successful - Signature verified and data access confirmed",
      secretInfo: {
        id: secret.id,
        name: secret.name,
        encryptedValueLength: secret.encrypted_value?.length || 0,
        encryptedAESKeyLength: secretKey.encrypted_aes_key?.length || 0,
        ivLength: Buffer.from(secret.iv || "", "hex").length,
        nonceLength: secretKey.nonce?.length || 0,
        ephemeralPublicKeyLength: secretKey.ephemeral_public_key?.length || 0,
      },
      signatureVerified: true,
    });
  } catch (error) {
    console.error("Diagnostic error:", error);
    res.status(500).json({
      error: `Diagnostic failed: ${error.message}`,
      step: "unknown",
    });
  }
});

// Get all secrets metadata for a wallet (without signature verification)
router.get("/metadata", async (req, res) => {
  try {
    const { walletAddress } = req.query;

    if (!walletAddress) {
      return res.status(400).json({
        error: "Wallet address is required",
      });
    }

    console.log(`Fetching secrets metadata for wallet ${walletAddress}`);

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
    const secretIds = secretKeys.map((key) => key.secret_id);

    // Get all secrets basic metadata
    const { data: secrets, error: secretsError } = await supabase
      .from("secrets")
      .select("id, name, type, project_id, environment_id")
      .in("id", secretIds);

    if (secretsError) {
      console.error("Error fetching secrets:", secretsError);
      throw secretsError;
    }

    // Get project info for each secret
    const projectIds = [...new Set(secrets.map((s) => s.project_id))];
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
      projects.forEach((p) => {
        projectMap[p.id] = p.name;
      });
    }

    // Get environment info for each secret
    const envIds = [...new Set(secrets.map((s) => s.environment_id))];
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
      environments.forEach((e) => {
        envMap[e.id] = e.name;
      });
    }

    // Combine all data
    const secretsWithDetails = secrets.map((secret) => ({
      id: secret.id,
      name: secret.name,
      type: secret.type,
      projectName: projectMap[secret.project_id] || "Unknown Project",
      environmentName: envMap[secret.environment_id] || "Unknown Environment",
    }));

    res.json({ secrets: secretsWithDetails });
  } catch (error) {
    console.error("Error in get secrets metadata:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
