const crypto = require('crypto');

// Securely store this key and do not hardcode it in production
const secretKey = 'your-secure-encryption-key'; // Use the same key as in the decryption code

function encrypt(text) {
  const cipher = crypto.createCipher('aes-256-cbc', secretKey);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

// Example usage
const originalText = 'BFEBFBFF000906E9-L1HF85Z005T-';
const encryptedText = encrypt(originalText);

console.log('Encrypted Text:', encryptedText);
