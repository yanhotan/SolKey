const crypto = require('crypto');

/** @returns {Buffer} Initialization vector */
function generateIV() {
    return crypto.randomBytes(16);
}

/**
 * @param {string} text Text to hash
 * @returns {string} SHA-256 hash in hex format
 */
function hash(text) {
    return crypto.createHash('sha256').update(text).digest('hex');
}

/** 
 * @param {string} text Text to encrypt
 * @param {string} key Encryption key
 * @returns {{iv: string, encryptedData: string}} Encrypted data with IV
 */
function encrypt(text, key) {
    const iv = generateIV();
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key), iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return {
        iv: iv.toString('hex'),
        encryptedData: encrypted
    };
}

/** 
 * @param {{iv: string, encryptedData: string}} encryptedData Data to decrypt
 * @param {string} key Decryption key
 * @returns {string} Decrypted text
 */
function decrypt(encryptedData, key) {
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key), Buffer.from(encryptedData.iv, 'hex'));
    let decrypted = decipher.update(encryptedData.encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

module.exports = {
    encrypt,
    decrypt,
    hash
};