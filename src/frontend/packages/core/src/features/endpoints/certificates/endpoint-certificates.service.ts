import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

export interface CertificateSummary {
  subject: string;
  issuer: string;
  not_before: string;
  not_after: string;
  sha256: string;
}

export interface TrustResult {
  host: string;
  trusted: boolean;
  reason?: string;
}

export type CertificateState = 'ok' | 'expiring' | 'expired';

const DAY_MS = 86_400_000;
const EXPIRING_DAYS = 30;
const SEVERITY: Record<CertificateState, number> = { ok: 0, expiring: 1, expired: 2 };

/** Days are whole days: remaining when valid, elapsed when expired. */
export function certificateState(c: CertificateSummary, now: Date = new Date()): { state: CertificateState; days: number } {
  const diff = new Date(c.not_after).getTime() - now.getTime();
  if (diff <= 0) {
    return { state: 'expired', days: Math.floor(-diff / DAY_MS) };
  }
  const days = Math.floor(diff / DAY_MS);
  return { state: days <= EXPIRING_DAYS ? 'expiring' : 'ok', days };
}

export function worstCertificateState(list: CertificateSummary[], now: Date = new Date()): CertificateState | null {
  let worst: CertificateState | null = null;
  for (const c of list) {
    const { state } = certificateState(c, now);
    if (worst === null || SEVERITY[state] > SEVERITY[worst]) {
      worst = state;
    }
  }
  return worst;
}

/** The server's message from a {"status":"error","error":"..."} body, else a generic one. */
export function certificateErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof HttpErrorResponse) {
    const body = err.error;
    if (body && typeof body === 'object' && typeof body.error === 'string' && body.error) {
      return body.error;
    }
  }
  return fallback;
}

@Injectable({ providedIn: 'root' })
export class EndpointCertificatesService {
  private http = inject(HttpClient);

  decode(pem: string): Promise<CertificateSummary[]> {
    const body = new FormData();
    body.append('ca_cert', pem);
    return firstValueFrom(this.http.post<CertificateSummary[]>('/api/v1/endpoints/certificates/decode', body));
  }

  /** Sending pem (even empty) overrides the stored CA; omitting it uses the stored one. */
  checkTrust(guid: string, pem?: string): Promise<TrustResult[]> {
    const body = new FormData();
    if (pem !== undefined) {
      body.append('ca_cert', pem);
    }
    return firstValueFrom(this.http.post<TrustResult[]>(`/api/v1/endpoints/${encodeURIComponent(guid)}/trust`, body));
  }
}
