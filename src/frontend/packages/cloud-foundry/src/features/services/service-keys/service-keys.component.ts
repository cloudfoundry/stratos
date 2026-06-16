import { DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, Signal, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { CopyToClipboardComponent, IHeaderBreadcrumb, ListSubNavAddAction, ListSubNavComponent, PageHeaderComponent } from '@stratosui/core';
import { writeWithJob } from '../../../services/async-jobs/write-with-job';
import { StratosJobError } from '../../../services/async-jobs/async-job.types';
import { ServiceCatalogDataService, ServiceKeyView, SignalSource } from '../../../services/endpoint-data/service-catalog-data.service';
import { StServiceInstance } from '../../../services/endpoint-data/stratos-types';

type RowStatus = 'idle' | 'busy' | 'error';

interface KeyDetailsResponse {
  credentials?: Record<string, unknown>;
}

interface OfferingBindableResponse {
  bindable?: boolean;
}

// One displayable credential entry. `sensitive` drives on-screen masking;
// `value` always holds the real value so copy works even while masked.
interface CredentialField {
  key: string;
  value: string;
  sensitive: boolean;
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

function toCredentialFields(creds: Record<string, unknown>): CredentialField[] {
  return Object.entries(creds).map(([key, raw]) => {
    const value = typeof raw === 'string' ? raw : JSON.stringify(raw);
    return {
      key,
      value,
      sensitive: SENSITIVE_KEY.test(key) || EMBEDDED_CREDENTIAL.test(value),
    };
  });
}

// ServiceKeysComponent — per-instance Service Keys page, reached via the
// /services/:type/:endpointId/:serviceInstanceId/keys route (sibling to the
// edit/detach action routes). Service keys are credential bindings (type=key).
// Each key renders as an accordion panel (mirroring the app instances
// accordion); expanding lazily loads its credentials, shown as a masked,
// per-field-copyable list. Create/delete ride the writeWithJob async-job
// contract.
@Component({
  selector: 'app-service-keys',
  templateUrl: './service-keys.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, PageHeaderComponent, CopyToClipboardComponent, ListSubNavComponent],
})
export class ServiceKeysComponent {
  private http = inject(HttpClient);
  private catalog = inject(ServiceCatalogDataService);

  readonly cfGuid: string;
  readonly siGuid: string;

  private instanceSource: SignalSource<StServiceInstance | null>;
  readonly title: Signal<string> = computed(() => {
    const name = this.instanceSource.value()?.name;
    return name ? `Service keys for '${name}'` : 'Service keys';
  });

  // Breadcrumb back to the services wall (no per-instance detail page exists
  // to link the instance itself; the title carries the instance name).
  readonly breadcrumbs: IHeaderBreadcrumb[] = [
    { breadcrumbs: [{ value: 'Services', routerLink: '/services' }] },
  ];

  // Reloadable list source: swapping the signal re-derives keys/loading.
  private keysSource = signal<SignalSource<ServiceKeyView[]>>(
    { value: signal<ServiceKeyView[]>([]).asReadonly(), isLoading: signal(false).asReadonly(), error: signal(null).asReadonly() },
  );
  readonly keys: Signal<ServiceKeyView[]> = computed(() => this.keysSource().value());
  readonly loading: Signal<boolean> = computed(() => this.keysSource().isLoading());

  readonly newKeyName = signal('');
  readonly creating = signal(false);
  readonly errorMessage = signal<string | null>(null);
  // Inline create form on the sub-nav row (revealed by the Add button),
  // mirroring the Variables tab pattern rather than an always-visible form.
  readonly isAdding = signal(false);
  readonly keyCount = computed(() => this.keys().length);

  // Authoritative bindability backup. The list row-action gate is best-effort
  // off the warmed offerings store (which can be cold/slow on multi-CF
  // foundations), so it may fail open and show the action for a non-bindable
  // service. Here we fetch the offering directly once the instance loads and
  // block create when the broker doesn't support keys. undefined = not yet
  // known (fail open); false = confirmed not supported.
  readonly bindable = signal<boolean | undefined>(undefined);
  readonly notBindable = computed(() => this.bindable() === false);
  private bindableFetchStarted = false;

  // Sub-nav "Add Service Key" button → reveals the inline create form.
  // Disabled when the offering isn't bindable (no keys possible).
  readonly addKeyAction: ListSubNavAddAction = {
    label: 'Add Service Key',
    icon: 'add',
    invoke: () => { this.errorMessage.set(null); this.newKeyName.set(''); this.isAdding.set(true); },
    disabled: this.notBindable,
  };

  // Accordion + per-key credential state, all keyed by key guid.
  private openByGuid = signal<Record<string, boolean>>({});
  private credsByGuid = signal<Record<string, Record<string, unknown>>>({});
  private credsLoadingByGuid = signal<Record<string, boolean>>({});
  private credsErrorByGuid = signal<Record<string, string>>({});
  // Revealed sensitive fields, keyed `${guid}::${fieldKey}`.
  private shownFields = signal<ReadonlySet<string>>(new Set<string>());
  // Per-key delete status.
  private statusByGuid = signal<Record<string, RowStatus>>({});

  isOpen = (guid: string): boolean => this.openByGuid()[guid] ?? false;
  credsLoading = (guid: string): boolean => this.credsLoadingByGuid()[guid] ?? false;
  credsError = (guid: string): string | undefined => this.credsErrorByGuid()[guid];
  rowStatus = (guid: string): RowStatus => this.statusByGuid()[guid] ?? 'idle';
  credentialFields = (guid: string): CredentialField[] => {
    const creds = this.credsByGuid()[guid];
    return creds ? toCredentialFields(creds) : [];
  };
  fieldShown = (guid: string, key: string): boolean => this.shownFields().has(`${guid}::${key}`);
  displayValue = (guid: string, field: CredentialField): string =>
    field.sensitive && !this.fieldShown(guid, field.key) ? '••••••••' : field.value;
  allCredsJson = (guid: string): string => JSON.stringify(this.credsByGuid()[guid] ?? {}, null, 2);

  constructor() {
    const route = inject(ActivatedRoute);
    this.cfGuid = route.snapshot.params.endpointId;
    this.siGuid = route.snapshot.params.serviceInstanceId;
    this.instanceSource = this.catalog.serviceInstance(this.cfGuid, this.siGuid);
    this.reload();

    // Once the instance summary lands we know the offering guid; fetch the
    // offering once to resolve bindability authoritatively (backup for the
    // best-effort list gate). Runs in the injection context so the effect is
    // cleaned up with the component.
    effect(() => {
      const offeringGuid = this.instanceSource.value()?.servicePlan?.serviceOffering?.guid;
      if (this.bindableFetchStarted || !offeringGuid) return;
      this.bindableFetchStarted = true;
      void this.loadBindable(offeringGuid);
    });
  }

  reload(): void {
    this.keysSource.set(this.catalog.serviceKeysForInstance(this.cfGuid, this.siGuid));
  }

  toggleOpen(guid: string): void {
    const opening = !this.isOpen(guid);
    this.openByGuid.update(prev => ({ ...prev, [guid]: opening }));
    if (opening && this.credsByGuid()[guid] === undefined && !this.credsLoading(guid)) {
      void this.loadCredentials(guid);
    }
  }

  toggleField(guid: string, key: string): void {
    const id = `${guid}::${key}`;
    this.shownFields.update(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
  }

  private async loadCredentials(guid: string): Promise<void> {
    this.credsLoadingByGuid.update(prev => ({ ...prev, [guid]: true }));
    this.credsErrorByGuid.update(prev => { const n = { ...prev }; delete n[guid]; return n; });
    try {
      const details = await firstValueFrom(
        this.http.get<KeyDetailsResponse>(`/pp/v1/cf/service_keys/${this.cfGuid}/${guid}/details`),
      );
      this.credsByGuid.update(prev => ({ ...prev, [guid]: details?.credentials ?? {} }));
    } catch (err: unknown) {
      this.credsErrorByGuid.update(prev => ({ ...prev, [guid]: this.messageOf(err) }));
    } finally {
      this.credsLoadingByGuid.update(prev => ({ ...prev, [guid]: false }));
    }
  }

  private async loadBindable(offeringGuid: string): Promise<void> {
    try {
      const offering = await firstValueFrom(
        this.http.get<OfferingBindableResponse>(`/pp/v1/cf/service_offerings/${this.cfGuid}/${offeringGuid}`),
      );
      // Absent flag → treat as supported (fail open); explicit false → blocked.
      this.bindable.set(offering?.bindable ?? true);
    } catch {
      // Leave undefined (fail open) — don't block create on a lookup failure.
    }
  }

  async createKey(): Promise<void> {
    const name = this.newKeyName().trim();
    if (!name || this.creating() || this.notBindable()) {
      return;
    }
    this.creating.set(true);
    this.errorMessage.set(null);
    const body = {
      name,
      relationships: { service_instance: { data: { guid: this.siGuid } } },
    };
    try {
      await writeWithJob(
        this.http,
        this.http.post(`/pp/v1/cf/service_keys/${this.cfGuid}`, body, { observe: 'response' as const }),
      );
      this.newKeyName.set('');
      this.isAdding.set(false);
      this.reload();
    } catch (err: unknown) {
      this.errorMessage.set(`Failed to create key: ${this.messageOf(err)}`);
    } finally {
      this.creating.set(false);
    }
  }

  cancelCreate(): void {
    this.isAdding.set(false);
    this.newKeyName.set('');
  }

  async deleteKey(guid: string): Promise<void> {
    if (this.rowStatus(guid) === 'busy') {
      return;
    }
    this.setStatus(guid, 'busy');
    try {
      await writeWithJob(
        this.http,
        this.http.delete(`/pp/v1/cf/service_keys/${this.cfGuid}/${guid}`, { observe: 'response' as const }),
      );
      this.reload();
    } catch (err: unknown) {
      this.setStatus(guid, 'error');
      this.errorMessage.set(`Failed to delete key: ${this.messageOf(err)}`);
    }
  }

  private setStatus(guid: string, status: RowStatus): void {
    this.statusByGuid.update(prev => ({ ...prev, [guid]: status }));
  }

  private messageOf(err: unknown): string {
    if (err instanceof StratosJobError) {
      return err.message;
    }
    if (err instanceof Error) {
      return err.message;
    }
    return 'unknown error';
  }
}
