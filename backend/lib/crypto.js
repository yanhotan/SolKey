const crypto = require("crypto");
const { createClient } = require("@supabase/supabase-js");
const { PublicKey } = require("@solana/web3.js");
const nacl = require("tweetnacl");
const util = require("tweetnacl-util");
const bs58 = require("bs58");
const { convertPublicKeyToX25519 } = require("ed2curve");

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Constants
const AES_KEY_SIZE = 32; // 256 bits

// Generate a random AES key
function generateAESKey() {
  return crypto.randomBytes(AES_KEY_SIZE);
}

function encryptAESKeyForUser(aesKey, userPublicKeyBase58) {
  // Convert Solana public key (base58) to bytes
  const ed25519PublicKey = bs58.decode(userPublicKeyBase58);

  // Convert Ed25519 public key to X25519
  const x25519PublicKey = convertPublicKeyToX25519(ed25519PublicKey);
  if (!x25519PublicKey) throw new Error("Invalid public key conversion");

  // Generate ephemeral keypair
  const ephemeralKeypair = nacl.box.keyPair();

  // Derive shared secret (ECDH)
  const nonce = nacl.randomBytes(nacl.box.nonceLength);
  const encryptedAESKey = nacl.box(
    aesKey,
    nonce,
    x25519PublicKey,
    ephemeralKeypair.secretKey
  );

  return {
    encryptedAESKey: util.encodeBase64(encryptedAESKey),
    nonce: util.encodeBase64(nonce),
    ephemeralPublicKey: util.encodeBase64(ephemeralKeypair.publicKey),
  };
}

// Encrypt data with AES
function encryptWithAES(data, key) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

  let encrypted = cipher.update(data, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag();

  return {
    encrypted,
    iv: iv.toString("hex"),
    authTag: authTag.toString("hex"),
  };
}

// Decrypt data with AES
function decryptWithAES(encryptedData, key, iv, authTag) {
  const decipher = crypto.createDecipheriv(
    "aes-256-gcm",
    key,
    Buffer.from(iv, "hex")
  );

  decipher.setAuthTag(Buffer.from(authTag, "hex"));

  let decrypted = decipher.update(encryptedData, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

function decryptAESKeyForUser(
  encryptedAESKeyBase64,
  nonceBase64,
  ephemeralPublicKeyBase64,
  userPrivateKeyBase58
) {
  try {
    // Convert Solana private key (base58) to bytes
    const ed25519PrivateKey = bs58.decode(userPrivateKeyBase58);

    // Convert Ed25519 private key to X25519
    const x25519PrivateKey = convertPublicKeyToX25519(ed25519PrivateKey);
    if (!x25519PrivateKey) throw new Error("Invalid private key conversion");

    // Convert base64 strings to Uint8Arrays
    const encryptedAESKey = util.decodeBase64(encryptedAESKeyBase64);
    const nonce = util.decodeBase64(nonceBase64);
    const ephemeralPublicKey = util.decodeBase64(ephemeralPublicKeyBase64);

    // Decrypt the AES key using Box.open
    const decryptedAESKey = nacl.box.open(
      encryptedAESKey,
      nonce,
      ephemeralPublicKey,
      x25519PrivateKey
    );

    if (!decryptedAESKey) {
      throw new Error("Failed to decrypt AES key");
    }

    return decryptedAESKey;
  } catch (error) {
    throw new Error(`Failed to decrypt AES key: ${error.message}`);
  }
}

// Create a new secret
async function createSecret(
  projectId,
  environmentId,
  name,
  value,
  type,
  creatorWalletAddress
) {
  try {
    // Generate random AES key
    const secretKey = crypto.randomBytes(32); // 256-bit AES key

    // Encrypt secret data with AES
    const encryptedSecret = encryptWithAES(value, secretKey);

    // Get project members
    const { data: members, error: membersError } = await supabase
      .from("project_members")
      .select("wallet_address")
      .eq("project_id", projectId);

    if (membersError) throw membersError;

    // Store the secret data (encrypted value)
    const { data: secret, error: secretError } = await supabase
      .from("secrets")
      .insert([
        {
          project_id: projectId,
          environment_id: environmentId,
          name,
          encrypted_value: encryptedSecret.encrypted,
          type,
          iv: encryptedSecret.iv,
          auth_tag: encryptedSecret.authTag,
        },
      ])
      .select()
      .single();

    if (secretError) throw secretError;

    // Encrypt AES key for each member
    for (const member of members) {
      const { encryptedAESKey, nonce, ephemeralPublicKey } =
        encryptAESKeyForUser(secretKey, member.wallet_address);

      // Store encrypted AES key for this member
      const { error: keyStoreError } = await supabase
        .from("secret_keys")
        .insert([
          {
            secret_id: secret.id,
            wallet_address: member.wallet_address,
            encrypted_aes_key: encryptedAESKey,
            nonce: nonce,
            ephemeral_public_key: ephemeralPublicKey,
          },
        ]);

      if (keyStoreError) throw keyStoreError;
    }

    return {
      ...secret,
      message: "Secret created securely with E2EE",
    };
  } catch (error) {
    throw new Error(`Failed to create secret: ${error.message}`);
  }
}

// Get a secret
async function getSecret(secretId, walletAddress, privateKeyBase58) {
  try {
    // Get the secret
    const { data: secret, error: secretError } = await supabase
      .from("secrets")
      .select("*")
      .eq("id", secretId)
      .single();

    if (secretError) throw secretError;

    // Get the user's encrypted AES key
    const { data: keyData, error: keyError } = await supabase
      .from("secret_keys")
      .select("*")
      .eq("secret_id", secretId)
      .eq("wallet_address", walletAddress)
      .single();

    if (keyError) throw keyError;

    // Decrypt the AES key using the user's private key
    const decryptedAESKey = decryptAESKeyForUser(
      keyData.encrypted_aes_key,
      keyData.nonce,
      keyData.ephemeral_public_key,
      privateKeyBase58
    );

    // Verify access by attempting to decrypt (but don't return the value)
    decryptWithAES(
      secret.encrypted_value,
      decryptedAESKey,
      secret.iv,
      secret.auth_tag
    );

    // Return only the encrypted data
    return {
      id: secret.id,
      project_id: secret.project_id,
      environment_id: secret.environment_id,
      name: secret.name,
      encrypted_value: secret.encrypted_value,
      type: secret.type,
      iv: secret.iv,
      auth_tag: secret.auth_tag,
      created_at: secret.created_at,
      updated_at: secret.updated_at,
    };
  } catch (error) {
    throw new Error(`Failed to get secret: ${error.message}`);
  }
}

// Share a secret with another user
async function shareSecret(
  secretId,
  targetWalletAddress,
  creatorWalletAddress
) {
  try {
    // Verify the target user is a project member
    const { data: secret, error: secretError } = await supabase
      .from("secrets")
      .select("project_id")
      .eq("id", secretId)
      .single();

    if (secretError) throw secretError;

    const { data: member, error: memberError } = await supabase
      .from("project_members")
      .select("wallet_address")
      .eq("project_id", secret.project_id)
      .eq("wallet_address", targetWalletAddress)
      .single();

    if (memberError || !member) {
      throw new Error("User is not a member of this project");
    }

    // Get the creator's encrypted AES key
    const { data: creatorKey, error: creatorKeyError } = await supabase
      .from("secret_keys")
      .select("*")
      .eq("secret_id", secretId)
      .eq("wallet_address", creatorWalletAddress)
      .single();

    if (creatorKeyError) throw creatorKeyError;

    // Store the AES key for the target user
    const { error: targetKeyError } = await supabase
      .from("secret_keys")
      .insert([
        {
          secret_id: secretId,
          wallet_address: targetWalletAddress,
          encrypted_aes_key: creatorKey.encrypted_aes_key,
          iv: creatorKey.iv,
          auth_tag: creatorKey.auth_tag,
        },
      ]);

    if (targetKeyError) throw targetKeyError;

    return { message: "Secret shared successfully" };
  } catch (error) {
    throw new Error(`Failed to share secret: ${error.message}`);
  }
}

module.exports = {
  createSecret,
  getSecret,
  shareSecret,
};
