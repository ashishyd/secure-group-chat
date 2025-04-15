// This module uses Node.js’s built-in crypto module to perform AES‑128-CBC encryption/decryption.

import crypto from "crypto";

const ALGORITHM = process.env.ENCRYPT_ALGORITHM || "aes-128-cbc";
const KEY = Buffer.from(
  process.env.ENCRYPTION_KEY || "1234567890123456",
  "utf8",
); // Must be 16 bytes.
const IV = Buffer.from(process.env.ENCRYPTION_IV || "abcdefghijklmnop", "utf8"); // Must be 16 bytes.

/**
 * Encrypts a plaintext message using AES-128-CBC.
 * @param message - The plaintext string.
 * @returns The encrypted message in hexadecimal format.
 */
export function encryptMessage(message: string): string {
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, IV);
  let encrypted = cipher.update(message, "utf8", "hex");
  encrypted += cipher.final("hex");
  return encrypted;
}

/**
 * Decrypts an encrypted hexadecimal message using AES-128-CBC.
 * @param encryptedMessage - The encrypted message in hexadecimal.
 * @returns The decrypted plaintext message.
 */
export function decryptMessage(encryptedMessage: string): string {
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, IV);
  let decrypted = decipher.update(encryptedMessage, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}
