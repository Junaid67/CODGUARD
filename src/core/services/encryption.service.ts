import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

/**
 * Central crypto service.
 *
 *  - hash():    deterministic SHA-256 HMAC. Use for lookups (phone_hash) —
 *               consistent and one-way, never reversible.
 *  - encrypt(): AES-256-GCM. Use for values that must be displayed later to
 *               the owning store (raw phone, Shopify access token).
 *  - decrypt(): reverse of encrypt(), with auth-tag verification.
 *
 * Never log plaintext values passed through here.
 */
@Injectable()
export class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly key: Buffer;
  private readonly hashSecret: string;

  constructor(private readonly configService: ConfigService) {
    const keyHex = this.configService.get<string>('encryption.key');
    if (!keyHex) {
      throw new Error('ENCRYPTION_KEY is not configured');
    }
    this.key = Buffer.from(keyHex, 'hex');

    const hashSecret = this.configService.get<string>('encryption.hashSecret');
    if (!hashSecret) {
      throw new Error('HASH_SECRET is not configured');
    }
    this.hashSecret = hashSecret;
  }

  /** Deterministic HMAC-SHA256 hex digest — used for indexed lookups. */
  hash(value: string): string {
    return crypto
      .createHmac('sha256', this.hashSecret)
      .update(value)
      .digest('hex');
  }

  /** AES-256-GCM encrypt → "iv:tag:ciphertext" (all hex). */
  encrypt(value: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
    const encrypted = Buffer.concat([
      cipher.update(value, 'utf8'),
      cipher.final(),
    ]);
    const tag = cipher.getAuthTag();
    return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
  }

  /** Reverses encrypt(). Throws if the auth tag fails verification. */
  decrypt(encryptedData: string): string {
    const [ivHex, tagHex, encHex] = encryptedData.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');
    const encrypted = Buffer.from(encHex, 'hex');
    const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]);
    return decrypted.toString('utf8');
  }
}
