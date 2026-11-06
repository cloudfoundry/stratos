import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';

import { CopyToClipboardComponent } from '@stratosui/core';

// One displayable credential entry. `sensitive` drives on-screen masking;
// `value` always holds the real value so copy works even while masked;
// `displayMasked` is what to show while hidden — a full bullet mask for plain
// secrets, or a URL with only its password redacted so the host/port/db stay
// readable.
export interface CredentialField {
  key: string;
  value: string;
  sensitive: boolean;
  displayMasked: string;
}

// Mask credential keys that look like secrets. We iterate every field (rather
// than hardcoding username/password/url) so the list survives broker key-name
// changes; only the display is masked, never the copied value.
const SENSITIVE_KEY = /pass|secret|token|private|key|cred/i;
// Connection strings frequently embed the password as scheme://user:pass@host
// (e.g. a postgres `uri`). Mask by VALUE too so these don't leak even though
// the key ("uri"/"read_uri") looks innocuous; a plain URL without credentials
// stays visible.
const EMBEDDED_CREDENTIAL = /:\/\/[^/\s:@]+:[^/\s@]+@/;
// PEM private-key blocks (RSA/EC/OPENSSH/ENCRYPTED/PKCS#8) mask by VALUE so a
// key stored under an innocuous name ("SSL_PEM", "SERVER_CRT") never renders.
// Certificate blocks (-----BEGIN CERTIFICATE-----) are public material and
// deliberately stay visible.
const PEM_PRIVATE_KEY = /-----BEGIN (?:[A-Z0-9]+ )*PRIVATE KEY-----/;
const FULL_MASK = '••••••••';

// Redact only the password run in a scheme://user:pass@host URL, leaving the
// scheme, user, host, port and path readable. Non-URL values (or URLs without
// embedded credentials) pass through unchanged.
function redactEmbeddedCredential(value: string): string {
  return value.replace(/(:\/\/[^/\s:@]+:)[^/\s@]+(@)/, '$1<redacted>$2');
}

// Classify ONE key/value pair. Exported so surfaces that render pairs
// individually (the app Variables tab) share the exact heuristics used here.
export function toCredentialField(key: string, raw: unknown): CredentialField {
  const value = typeof raw === 'string' ? raw : JSON.stringify(raw);
  const isPrivateKey = PEM_PRIVATE_KEY.test(value);
  const embedsCredential = !isPrivateKey && EMBEDDED_CREDENTIAL.test(value);
  const sensitive = isPrivateKey || SENSITIVE_KEY.test(key) || embedsCredential;
  return {
    key,
    value,
    sensitive,
    displayMasked: embedsCredential ? redactEmbeddedCredential(value) : FULL_MASK,
  };
}

export function toCredentialFields(creds: Record<string, unknown>): CredentialField[] {
  return Object.entries(creds).map(([key, raw]) => toCredentialField(key, raw));
}

// Deep display-mask for structured env values (VCAP_SERVICES and friends):
// walks objects/arrays and masks leaves using the same heuristics as
// toCredentialField: fully masks PEM private-key blocks wherever they appear,
// redacts embedded scheme://user:pass@host credentials in strings (takes
// precedence over key-based masking), and fully masks other scalars under
// sensitive-named keys. Leaf-based on purpose — hosts/ports inside a `credentials` block stay
// readable, matching the Service Keys view. Returns a masked copy; never
// mutates the input.
export function maskEnvValue(key: string, value: unknown): unknown {
  if (value == null) {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map(v => maskEnvValue(key, v));
  }
  if (typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, maskEnvValue(k, v)]),
    );
  }
  if (typeof value === 'string' && PEM_PRIVATE_KEY.test(value)) {
    return FULL_MASK;
  }
  if (typeof value === 'string' && EMBEDDED_CREDENTIAL.test(value)) {
    return redactEmbeddedCredential(value);
  }
  if (SENSITIVE_KEY.test(key)) {
    return FULL_MASK;
  }
  return value;
}

// MaskedCredentialsComponent — a read-only key/value table of credential
// fields, sensitive ones masked by default with a per-field Show/Hide toggle
// and a copy-to-clipboard control that always copies the real value. One
// component instance renders one credential set (a service key's credentials,
// or a user-provided instance's), so reveal state is keyed by field key alone.
@Component({
  selector: 'app-masked-credentials',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CopyToClipboardComponent],
  template: `
    <!-- Not w-full: columns size to content so the key/value/actions align in
         tidy columns packed to the left, with the copy controls in one aligned
         column right after the values. -->
    <table class="text-left text-sm">
      <tbody>
        @for (field of fields(); track field.key) {
          <tr class="border-b border-content-border last:border-0">
            <td class="py-1 pr-8 align-top font-medium text-content-muted whitespace-nowrap">{{ field.key }}</td>
            <td class="py-1 pr-4 align-top break-all font-mono">{{ displayValue(field) }}</td>
            <td class="py-1 align-top whitespace-nowrap text-right">
              @if (field.sensitive) {
                <button type="button" class="text-link hover:underline text-xs"
                  (click)="toggleField(field.key)">
                  {{ fieldShown(field.key) ? 'Hide' : 'Show' }}
                </button>
              }
            </td>
            <!-- pl-10: the copy component renders its icon absolute-left of its
                 own (0-width) box, so reserve space here so it doesn't overlap
                 the Show column. -->
            <td class="py-1 pl-10 align-top">
              <app-copy-to-clipboard class="inline-block w-5" [text]="field.value"
                [tooltip]="'Copy ' + field.key"
                [showSuccessText]="false" [compact]="true"></app-copy-to-clipboard>
            </td>
          </tr>
        }
      </tbody>
    </table>
  `,
})
export class MaskedCredentialsComponent {
  readonly fields = input.required<CredentialField[]>();

  // Revealed sensitive field keys for this set.
  private shown = signal<ReadonlySet<string>>(new Set<string>());

  fieldShown = (key: string): boolean => this.shown().has(key);
  displayValue = (field: CredentialField): string =>
    field.sensitive && !this.fieldShown(field.key) ? field.displayMasked : field.value;

  toggleField(key: string): void {
    this.shown.update(prev => {
      const next = new Set(prev);
      if (next.has(key)) { next.delete(key); } else { next.add(key); }
      return next;
    });
  }
}
