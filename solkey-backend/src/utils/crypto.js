const crypto = require('crypto');

/**
 * Generates a random initialization vector for encryption.
 * @returns {Buffer} The initialization vector.
 */
function generateIV() {
    return crypto.randomBytes(16);
}

/**
 * Encrypts a given text using AES-256-CBC algorithm.
 * @param {string} text - The text to encrypt.
 * @param {string} key - The encryption key.
 * @returns {Object} The encrypted data and initialization vector.
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
 * Decrypts a given encrypted data using AES-256-CBC algorithm.
 * @param {Object} encryptedData - The encrypted data and initialization vector.
 * @param {string} key - The decryption key.
 * @returns {string} The decrypted text.
 */
function decrypt(encryptedData, key) {
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key), Buffer.from(encryptedData.iv, 'hex'));
    let decrypted = decipher.update(encryptedData.encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

module.exports = {
    encrypt,
    decrypt
};