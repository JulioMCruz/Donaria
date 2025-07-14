import CryptoJS from 'crypto-js'

const SALT = 'stellar-wallet-v1'
const ITERATIONS = 10000

export function encryptPrivateKey(privateKey: string, pin: string): string {
  try {
    const key = CryptoJS.PBKDF2(pin, SALT, {
      keySize: 256/32,
      iterations: ITERATIONS
    })
    
    const encrypted = CryptoJS.AES.encrypt(privateKey, key.toString()).toString()
    return encrypted
  } catch (error) {
    throw new Error('Failed to encrypt private key')
  }
}

export function decryptPrivateKey(encryptedKey: string, pin: string): string {
  try {
    const key = CryptoJS.PBKDF2(pin, SALT, {
      keySize: 256/32,
      iterations: ITERATIONS
    })
    
    const decrypted = CryptoJS.AES.decrypt(encryptedKey, key.toString())
    const privateKey = decrypted.toString(CryptoJS.enc.Utf8)
    
    if (!privateKey) {
      throw new Error('Invalid PIN')
    }
    
    return privateKey
  } catch (error) {
    throw new Error('Failed to decrypt private key. Invalid PIN.')
  }
}

export function validatePin(pin: string): boolean {
  return /^\d{4}$/.test(pin)
}