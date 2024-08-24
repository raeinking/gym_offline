const crypto = require('crypto');

// Securely store this key and do not hardcode it in production
const secretKey = 'your-secure-encryption-key'; // Use the same key that was used for encryption

function decrypt(text) {
  const decipher = crypto.createDecipher('aes-256-cbc', secretKey);
  let decrypted = decipher.update(text, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

const encryptedText = '5f23d37ad6acda115d62b1c95906206d4cf78e31a9affd59af369e5c87322334';
const originalText = decrypt(encryptedText);

console.log('Original Text:', originalText);
