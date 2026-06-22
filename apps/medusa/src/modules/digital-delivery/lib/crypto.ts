import crypto from "crypto"

// AES-256-GCM encryption for digital codes at rest (US-1.4 / RUM-13).
// Payload format: base64(iv):base64(authTag):base64(ciphertext)

const ALGORITHM = "aes-256-gcm"
const IV_BYTES = 12

function getKey(): Buffer {
  const secret = process.env.DIGITAL_CODE_ENCRYPTION_KEY
  if (!secret) {
    throw new Error(
      "DIGITAL_CODE_ENCRYPTION_KEY is not set; cannot encrypt/decrypt digital codes."
    )
  }
  // Derive a fixed 32-byte key from any-length secret so AES-256 always fits.
  return crypto.createHash("sha256").update(secret).digest()
}

export function encryptCode(plaintext: string): string {
  const iv = crypto.randomBytes(IV_BYTES)
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv)
  const ciphertext = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ])
  const authTag = cipher.getAuthTag()
  return [
    iv.toString("base64"),
    authTag.toString("base64"),
    ciphertext.toString("base64"),
  ].join(":")
}

export function decryptCode(payload: string): string {
  const [ivB64, tagB64, dataB64] = payload.split(":")
  if (!ivB64 || !tagB64 || !dataB64) {
    throw new Error("Malformed encrypted code payload.")
  }
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    getKey(),
    Buffer.from(ivB64, "base64")
  )
  decipher.setAuthTag(Buffer.from(tagB64, "base64"))
  return Buffer.concat([
    decipher.update(Buffer.from(dataB64, "base64")),
    decipher.final(),
  ]).toString("utf8")
}
