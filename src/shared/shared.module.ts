import { Global, Module } from '@nestjs/common';
import { TrimPipe } from './pipes/trim.pipe';
import { PhoneNormalizePipe } from './pipes/phone-normalize.pipe';

/**
 * Shared, app-wide utilities. Most of shared/ is plain functions/classes/DTOs
 * imported directly; this module provides the injectable pipes for modules
 * that bind them via DI. Marked @Global so they need not be re-imported.
 */
@Global()
@Module({
  providers: [TrimPipe, PhoneNormalizePipe],
  exports: [TrimPipe, PhoneNormalizePipe],
})
export class SharedModule {}
