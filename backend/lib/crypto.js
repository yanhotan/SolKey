const crypto = require("crypto");
const { PublicKey } = require("@solana/web3.js");
const nacl = require("tweetnacl");
const util = require("tweetnacl-util");
const bs58 = require("bs58");
const ed2curve = require("ed2curve");
const convertPublicKey = ed2curve.convertPublicKey; 
const convertSecretKey = ed2curve.convertSecretKey;
const { supabase } = require("./supabase");

// Constants
const AES_KEY_SIZE = 32; // 256 bits

// Generate a random AES key
function generateAESKey() {
  return crypto.randomBytes(AES_KEY_SIZE);
}

function encryptAESKeyForUser(aesKey, userPublicKeyBase58) {
  try {
    console.log("Encrypting AES key for wallet:", userPublicKeyBase58);
    
    // Convert Solana public key (base58) to bytes
    let ed25519PublicKey;
    try {
      ed25519PublicKey = bs58.decode(userPublicKeyBase58);
      console.log("Public key decoded successfully", { 
        length: ed25519PublicKey.length, 
        type: typeof ed25519PublicKey,
        isBuffer: Buffer.isBuffer(ed25519PublicKey)
      });
    } catch (decodeError) {
      console.error("bs58 decode error:", decodeError);
      throw new Error(`Failed to decode public key: ${decodeError.message}`);
    }
    
    if (!ed25519PublicKey || ed25519PublicKey.length !== 32) {
      throw new Error(`Invalid public key format or length: ${ed25519PublicKey?.length}`);
    }

    // Convert Ed25519 public key to X25519
    const x25519PublicKey = convertPublicKey(ed25519PublicKey);
    if (!x25519PublicKey) throw new Error("Invalid public key conversion to X25519");

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
  } catch (error) {
    console.error("AES key encryption error:", error);
    throw new Error(`Failed to encrypt AES key: ${error.message}`);
  }
}

// Encrypt data with AES
function encryptWithAES(data, key) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);

  let encrypted = cipher.update(data, "utf8", "base64");
  encrypted += cipher.final("base64");

  const authTag = cipher.getAuthTag();

  return {
    encrypted,
    iv: iv.toString("hex"),
    authTag: authTag.toString("hex"),
  };
}

// Decrypt data with AES
function decryptWithAES(encryptedData, key, iv, authTag) {
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedData, "base64", "utf8");
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
    let ed25519PrivateKey;
    try {
      ed25519PrivateKey = bs58.decode(userPrivateKeyBase58);
    } catch (decodeError) {
      console.error("bs58 decode error:", decodeError);
      throw new Error(`Failed to decode private key: ${decodeError.message}`);
    }

    // Convert Ed25519 private key to X25519
    const x25519PrivateKey = convertSecretKey(ed25519PrivateKey);
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
    console.error("AES key decryption error:", error);
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
    console.log("Creating secret:", { 
      projectId, 
      environmentId, 
      name, 
      valueLength: value?.length, 
      type,
      creatorWalletAddress
    });
    
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
    
    console.log(`Found ${members.length} project members to encrypt for`);

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
    
    console.log("Secret data stored successfully with ID:", secret.id);

    // Encrypt AES key for each member
    for (const member of members) {
      if (!member.wallet_address) {
        console.log("Skipping member with null wallet_address");
        continue;
      }

      console.log(`Encrypting for member: ${member.wallet_address}`);
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
    console.error("Secret creation error:", error);
    throw new Error(`Failed to create secret: ${error.message}`);
  }
}

// Get a secret
async function getSecret(secretId, walletAddress) {
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

    // Return only the encrypted data
    return {
      id: secret.id,
      name: secret.name,
      encrypted_value: secret.encrypted_value,
      type: secret.type,
      iv: secret.iv,
      auth_tag: secret.auth_tag,
      created_at: secret.created_at,
      updated_at: secret.updated_at,
      project_id: secret.project_id,
      environment_id: secret.environment_id,
      encrypted_aes_key: keyData.encrypted_aes_key,
      nonce: keyData.nonce,
      ephemeral_public_key: keyData.ephemeral_public_key,
    };
  } catch (error) {
    console.error("Get secret error:", error);
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
          nonce: creatorKey.nonce,
          ephemeral_public_key: creatorKey.ephemeral_public_key,
        },
      ]);

    if (targetKeyError) throw targetKeyError;

    return { message: "Secret shared successfully" };
  } catch (error) {
    console.error("Share secret error:", error);
    throw new Error(`Failed to share secret: ${error.message}`);
  }
}

module.exports = {
  createSecret,
  getSecret,
  shareSecret,
  decryptWithAES,
  decryptAESKeyForUser,
  encryptAESKeyForUser,
};