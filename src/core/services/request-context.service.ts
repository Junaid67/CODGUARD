import { Injectable, Scope } from '@nestjs/common';

/**
 * Per-request scoped store for correlation data (requestId, resolved shop
 * domain, client IP). Lets services attach consistent context to logs and
 * audit records without threading it through every method signature.
 */
@Injectable({ scope: Scope.REQUEST })
export class RequestContextService {
  private requestId: string;
  private shopDomain?: string;
  private ipAddress?: string;

  setRequestId(id: string): void {
    this.requestId = id;
  }

  getRequestId(): string {
    return this.requestId;
  }

  setShopDomain(domain: string): void {
    this.shopDomain = domain;
  }

  getShopDomain(): string | undefined {
    return this.shopDomain;
  }

  setIpAddress(ip: string): void {
    this.ipAddress = ip;
  }

  getIpAddress(): string | undefined {
    return this.ipAddress;
  }
}
