import { ChangeDetectionStrategy, Component, DestroyRef, effect, inject, input, output, signal } from '@angular/core';
import { DatePipe } from '@angular/common';

import {
  CertificateState,
  CertificateSummary,
  EndpointCertificatesService,
  TrustResult,
  certificateErrorMessage,
  certificateState,
  worstCertificateState,
} from './endpoint-certificates.service';

const DEBOUNCE_MS = 300;

interface CertificateCard {
  cert: CertificateSummary;
  badge: string | null;
  badgeClasses: string;
}

const PILL = 'inline-block px-2 py-0.5 rounded text-xs font-medium';
const PILL_WARNING = `${PILL} bg-warning-50 text-warning-900 dark:bg-warning-900/40 dark:text-warning-100`;
const PILL_DANGER = `${PILL} bg-danger-50 text-danger-900 dark:bg-danger-900/40 dark:text-danger-100`;

@Component({
  selector: 'app-endpoint-certificates',
  imports: [DatePipe],
  templateUrl: './endpoint-certificates.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EndpointCertificatesComponent {
  private service = inject(EndpointCertificatesService);

  pem = input('');
  endpointGuid = input<string | null>(null);
  worstState = output<CertificateState | null>();

  protected cards = signal<CertificateCard[]>([]);
  protected decodeError = signal('');
  protected trust = signal<TrustResult[] | null>(null);
  protected trustError = signal('');
  protected trustBusy = signal(false);
  protected checkedAt = signal<Date | null>(null);

  private decodeSeq = 0;
  private trustSeq = 0;

  constructor() {
    effect(onCleanup => {
      const pem = this.pem();
      // Trust results answer for the PEM checked: drop them, and the answer
      // to any check still in flight.
      this.trustSeq++;
      this.trust.set(null);
      this.trustError.set('');
      this.checkedAt.set(null);
      const timer = setTimeout(() => void this.decode(pem), pem.trim() ? DEBOUNCE_MS : 0);
      onCleanup(() => clearTimeout(timer));
    });
    inject(DestroyRef).onDestroy(() => this.decodeSeq++);
  }

  private async decode(pem: string): Promise<void> {
    const seq = ++this.decodeSeq;
    if (!pem.trim()) {
      this.cards.set([]);
      this.decodeError.set('');
      this.worstState.emit(null);
      return;
    }
    try {
      const list = await this.service.decode(pem);
      if (seq !== this.decodeSeq) {
        return;
      }
      this.cards.set(list.map(cert => this.toCard(cert)));
      this.decodeError.set('');
      this.worstState.emit(worstCertificateState(list));
    } catch (err) {
      if (seq !== this.decodeSeq) {
        return;
      }
      this.cards.set([]);
      this.decodeError.set(certificateErrorMessage(err, 'The certificate could not be read.'));
      this.worstState.emit(null);
    }
  }

  private toCard(cert: CertificateSummary): CertificateCard {
    const { state, days } = certificateState(cert);
    if (state === 'expired') {
      const badge = days === 0 ? 'Expired today' : `Expired ${days} ${days === 1 ? 'day' : 'days'} ago`;
      return { cert, badge, badgeClasses: PILL_DANGER };
    }
    if (state === 'expiring') {
      return { cert, badge: `Expires in ${days} ${days === 1 ? 'day' : 'days'}`, badgeClasses: PILL_WARNING };
    }
    return { cert, badge: null, badgeClasses: '' };
  }

  protected async checkTrust(): Promise<void> {
    const guid = this.endpointGuid();
    if (!guid || this.trustBusy()) {
      return;
    }
    const seq = this.trustSeq;
    this.trustBusy.set(true);
    this.trustError.set('');
    try {
      const results = await this.service.checkTrust(guid, this.pem());
      if (seq === this.trustSeq) {
        this.trust.set(results);
        this.checkedAt.set(new Date());
      }
    } catch (err) {
      if (seq === this.trustSeq) {
        this.trust.set(null);
        this.trustError.set(certificateErrorMessage(err, 'The trust check failed.'));
      }
    } finally {
      this.trustBusy.set(false);
    }
  }
}
