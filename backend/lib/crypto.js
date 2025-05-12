const crypto = require("crypto");
const { createClient } = require("@supabase/supabase-js");

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Constants
const AES_KEY_SIZE = 32; // 256 bits
const PBKDF2_ITERATIONS = 100000;
const PBKDF2_KEYLEN = 32; // 256 bits
const PBKDF2_DIGEST = "sha256";

// Generate a random AES key
function generateAESKey() {
  return crypto.randomBytes(AES_KEY_SIZE);
}

// Derive encryption key from wallet signature
async function deriveKeyFromSignature(signature) {
  return new Promise((resolve, reject) => {
    crypto.pbkdf2(
      signature,
      "solsecure-salt", // You might want to make this configurable
      PBKDF2_ITERATIONS,
      PBKDF2_KEYLEN,
      PBKDF2_DIGEST,
      (err, derivedKey) => {
        if (err) reject(err);
        resolve(derivedKey);
      }
    );
  });
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

// Create a new secret
async function createSecret(
  projectId,
  environmentId,
  name,
  value,
  type,
  creatorSignature,
  creatorUserId
) {
  try {
    // Generate random AES key for the secret
    const secretKey = generateAESKey();

    // Encrypt the secret value
    const encryptedSecret = encryptWithAES(value, secretKey);

    // Get all project members
    const { data: members, error: membersError } = await supabase
      .from("project_members")
      .select("user_id")
      .eq("project_id", projectId);

    if (membersError) throw membersError;

    // First, encrypt the secret key for the creator
    const creatorDerivedKey = await deriveKeyFromSignature(creatorSignature);
    const creatorEncryptedKey = encryptWithAES(
      secretKey.toString("hex"),
      creatorDerivedKey
    );

    // Store the secret
    const { data: secret, error: secretError } = await supabase
      .from("secrets")
      .insert([
        {
          project_id: projectId,
          environment_id: environmentId,
          name,
          value: encryptedSecret.encrypted,
          type,
          iv: encryptedSecret.iv,
          auth_tag: encryptedSecret.authTag,
        },
      ])
      .select()
      .single();

    if (secretError) throw secretError;

    // Store creator's encrypted key
    const { error: creatorKeyError } = await supabase
      .from("secret_keys")
      .insert([
        {
          secret_id: secret.id,
          user_id: creatorUserId,
          encrypted_key: creatorEncryptedKey.encrypted,
          iv: creatorEncryptedKey.iv,
          auth_tag: creatorEncryptedKey.authTag,
        },
      ]);

    if (creatorKeyError) throw creatorKeyError;

    return {
      ...secret,
      message:
        "Secret created. Other project members will need to provide their signatures to access this secret.",
    };
  } catch (error) {
    throw new Error(`Failed to create secret: ${error.message}`);
  }
}

// Get and decrypt a secret
async function getSecret(secretId, userSignature) {
  try {
    // Get the secret
    const { data: secret, error: secretError } = await supabase
      .from("secrets")
      .select("*")
      .eq("id", secretId)
      .single();

    if (secretError) throw secretError;

    // Get the user's encrypted key
    const { data: keyData, error: keyError } = await supabase
      .from("secret_keys")
      .select("*")
      .eq("secret_id", secretId)
      .single();

    if (keyError) throw keyError;

    // Derive user's key from signature
    const derivedKey = await deriveKeyFromSignature(userSignature);

    // Decrypt the secret key
    const secretKey = decryptWithAES(
      keyData.encrypted_key,
      derivedKey,
      keyData.iv,
      keyData.auth_tag
    );

    // Decrypt the secret value
    const decryptedValue = decryptWithAES(
      secret.value,
      Buffer.from(secretKey, "hex"),
      secret.iv,
      secret.auth_tag
    );

    return {
      ...secret,
      value: decryptedValue,
    };
  } catch (error) {
    throw new Error(`Failed to get secret: ${error.message}`);
  }
}

// Add a new function to share the secret with another user
async function shareSecret(
  secretId,
  targetUserId,
  targetSignature,
  creatorSignature
) {
  try {
    // Get the secret
    const { data: secret, error: secretError } = await supabase
      .from("secrets")
      .select("*")
      .eq("id", secretId)
      .single();

    if (secretError) throw secretError;

    // Verify the user is a project member
    const { data: member, error: memberError } = await supabase
      .from("project_members")
      .select("user_id")
      .eq("project_id", secret.project_id)
      .eq("user_id", targetUserId)
      .single();

    if (memberError || !member) {
      throw new Error("User is not a member of this project");
    }

    // Get the creator's encrypted key
    const { data: creatorKey, error: creatorKeyError } = await supabase
      .from("secret_keys")
      .select("*")
      .eq("secret_id", secretId)
      .single();

    if (creatorKeyError) throw creatorKeyError;

    // Derive key from creator's signature to decrypt the secret key
    const creatorDerivedKey = await deriveKeyFromSignature(creatorSignature);

    // Decrypt the secret key using creator's derived key
    const rawSecretKey = decryptWithAES(
      creatorKey.encrypted_key,
      creatorDerivedKey,
      creatorKey.iv,
      creatorKey.auth_tag
    );

    // Derive key from target user's signature
    const targetDerivedKey = await deriveKeyFromSignature(targetSignature);

    // Encrypt the raw secret key for the target user
    const targetEncryptedKey = encryptWithAES(rawSecretKey, targetDerivedKey);

    // Store the target user's encrypted key
    const { error: targetKeyError } = await supabase
      .from("secret_keys")
      .insert([
        {
          secret_id: secretId,
          user_id: targetUserId,
          encrypted_key: targetEncryptedKey.encrypted,
          iv: targetEncryptedKey.iv,
          auth_tag: targetEncryptedKey.authTag,
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
  deriveKeyFromSignature,
};
