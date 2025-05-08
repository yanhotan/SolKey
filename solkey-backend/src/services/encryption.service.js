// This service handles encryption and decryption of secrets.
// It uses a symmetric encryption algorithm to secure sensitive data.

const crypto = require('crypto');
const algorithm = 'aes-256-cbc'; // Encryption algorithm
const key = crypto.randomBytes(32); // Key for encryption
const iv = crypto.randomBytes(16); // Initialization vector

/**
 * Encrypts a given text using AES-256-CBC algorithm.
 * @param {string} text - The text to encrypt.
 * @returns {string} - The encrypted text in hexadecimal format.
 */
function encrypt(text) {
    let cipher = crypto.createCipheriv(algorithm, Buffer.from(key), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex'); // Return IV and encrypted text
}

/**
 * Decrypts a given encrypted text using AES-256-CBC algorithm.
 * @param {string} text - The encrypted text in hexadecimal format.
 * @returns {string} - The decrypted text.
 */
function decrypt(text) {
    let textParts = text.split(':');
    let iv = Buffer.from(textParts.shift(), 'hex'); // Extract IV
    let encryptedText = Buffer.from(textParts.join(':'), 'hex');
    let decipher = crypto.createDecipheriv(algorithm, Buffer.from(key), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString(); // Return decrypted text
}

module.exports = {
    encrypt,
    decrypt
};