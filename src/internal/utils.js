/**
 * Method that encrypts a plain text with a password.
 * @param plainText the plain text
 * @param password the password
 * @return {Promise<string>} a promise that resolves to the cipher text
 */
export const aesEncrypt = async (plainText, password) => {
    const passwordBytes = new TextEncoder().encode(password);
    const passwordHash = await crypto.subtle.digest('SHA-256', passwordBytes);

    const iv = crypto.getRandomValues(new Uint8Array(12));
    const alg = { name: 'AES-GCM', iv: iv };
    const encryptionKey = await crypto.subtle.importKey('raw', passwordHash, alg, false, ['encrypt']);

    const dataBytes = new TextEncoder().encode(plainText);
    const cipherBuffer = await crypto.subtle.encrypt(alg, encryptionKey, dataBytes);

    const cipherBytesArray = Array.from(new Uint8Array(cipherBuffer));
    const cipherString = cipherBytesArray.map(byte => String.fromCharCode(byte)).join('');
    const cipherBase64 = Buffer.from(cipherString, 'binary').toString('base64')

    const ivHex = Array.from(iv).map(b => ('00' + b.toString(16)).slice(-2)).join('');
    return ivHex + cipherBase64
}

/**
 * Method that decrypts an encrypted plain text with a password.
 * @param encryptedText the encryptedText plain text
 * @param password the password
 * @return {Promise<string>} a promise that resolves to the plain text
 */
export const aesDecrypt = async (encryptedText, password) => {
    const passwordBytes = new TextEncoder().encode(password);
    const passwordHash = await crypto.subtle.digest('SHA-256', passwordBytes);

    const iv = encryptedText.slice(0,24).match(/.{2}/g).map(byte => parseInt(byte, 16));
    const alg = { name: 'AES-GCM', iv: new Uint8Array(iv) };
    const decryptionKey = await crypto.subtle.importKey('raw', passwordHash, alg, false, ['decrypt']);
    const cipherBytes = Buffer.from(encryptedText.slice(24), 'base64');
    const plainBuffer = await crypto.subtle.decrypt(alg, decryptionKey, cipherBytes);
    const plaintext = new TextDecoder().decode(plainBuffer);
    return plaintext
}