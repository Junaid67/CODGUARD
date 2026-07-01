import { Injectable, PipeTransform, ArgumentMetadata } from '@nestjs/common';

/**
 * Recursively trims whitespace from all string values in the request body.
 * Applied globally in main.ts before validation.
 */
@Injectable()
export class TrimPipe implements PipeTransform {
  transform(value: unknown, metadata: ArgumentMetadata): unknown {
    if (metadata.type === 'body' && value && typeof value === 'object') {
      return this.trim(value);
    }
    return value;
  }

  private trim(value: unknown): unknown {
    if (typeof value === 'string') {
      return value.trim();
    }
    if (Array.isArray(value)) {
      return value.map((item) => this.trim(item));
    }
    if (value && typeof value === 'object') {
      const out: Record<string, unknown> = {};
      for (const [key, val] of Object.entries(value)) {
        out[key] = this.trim(val);
      }
      return out;
    }
    return value;
  }
}
