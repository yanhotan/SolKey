// Test script for bs58 functionality
const bs58 = require('bs58');
const nacl = require('tweetnacl');
const ed2curve = require('ed2curve');
const convertPublicKey = ed2curve.convertPublicKey;

// Test wallet address
const walletAddress = 'FVccA9fkLhz2VeTTMeNSz6E8pJkxzq4DT2ExxGSoHpGz';

console.log('Testing bs58 decode with wallet address:', walletAddress);

try {
  // Test bs58 decode
  const decoded = bs58.decode(walletAddress);
  console.log('Successfully decoded wallet address:');
  console.log('  - Type:', typeof decoded);
  console.log('  - Is Buffer:', Buffer.isBuffer(decoded));
  console.log('  - Length:', decoded.length);
  console.log('  - Bytes:', decoded);

  // Test conversion to X25519
  if (decoded.length === 32) {
    try {
      const x25519PublicKey = convertPublicKey(decoded);
      console.log('Successfully converted to X25519:');
      console.log('  - Length:', x25519PublicKey.length);
    } catch (conversionError) {
      console.error('Error converting to X25519:', conversionError);
    }
  } else {
    console.error('Decoded key length is not 32 bytes, cannot convert to X25519');
  }

  // Test a full encryption flow
  try {
    // Create a sample AES key
    const aesKey = Buffer.from(Array(32).fill(1));
    console.log('Sample AES key created:', aesKey.length, 'bytes');

    // Convert Ed25519 public key to X25519
    const x25519PublicKey = convertPublicKey(decoded);
    console.log('Converted to X25519 successfully');

    // Generate ephemeral keypair
    const ephemeralKeypair = nacl.box.keyPair();
    console.log('Generated ephemeral keypair');

    // Derive shared secret (ECDH)
    const nonce = nacl.randomBytes(nacl.box.nonceLength);
    console.log('Generated nonce:', nonce.length, 'bytes');

    // Encrypt the AES key
    const encryptedAESKey = nacl.box(
      aesKey,
      nonce,
      x25519PublicKey,
      ephemeralKeypair.secretKey
    );
    console.log('Successfully encrypted AES key:', encryptedAESKey.length, 'bytes');

    console.log('Full encryption flow completed successfully!');
  } catch (encryptionError) {
    console.error('Error in encryption flow:', encryptionError);
  }
} catch (decodeError) {
  console.error('bs58 decode error:', decodeError);
} 