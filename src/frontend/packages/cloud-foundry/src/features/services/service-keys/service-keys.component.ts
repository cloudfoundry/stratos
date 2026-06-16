import { DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, Signal, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { PageHeaderComponent } from '@stratosui/core';
import { writeWithJob } from '../../../services/async-jobs/write-with-job';
import { StratosJobError } from '../../../services/async-jobs/async-job.types';
import { ServiceCatalogDataService, ServiceKeyView, SignalSource } from '../../../services/endpoint-data/service-catalog-data.service';
import { StServiceInstance } from '../../../services/endpoint-data/stratos-types';

type RowStatus = 'idle' | 'busy' | 'error';

interface KeyDetailsResponse {
  credentials?: Record<string, unknown>;
}

// ServiceKeysComponent — per-instance Service Keys page, reached via the
// /services/:type/:endpointId/:serviceInstanceId/keys route (sibling to the
// existing edit/detach action routes). Lists the instance's service keys
// (credential bindings with type=key), with create / reveal-credentials /
// delete. Create and delete ride the writeWithJob async-job contract.
@Component({
  selector: 'app-service-keys',
  templateUrl: './service-keys.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, PageHeaderComponent],
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

  // Reloadable list source: swapping the signal re-derives keys/loading.
  private keysSource = signal<SignalSource<ServiceKeyView[]>>(
    // placeholder replaced in the constructor once guids are read
    { value: signal<ServiceKeyView[]>([]).asReadonly(), isLoading: signal(false).asReadonly(), error: signal(null).asReadonly() },
  );
  readonly keys: Signal<ServiceKeyView[]> = computed(() => this.keysSource().value());
  readonly loading: Signal<boolean> = computed(() => this.keysSource().isLoading());

  readonly newKeyName = signal('');
  readonly creating = signal(false);
  readonly errorMessage = signal<string | null>(null);

  // Per-row delete status + revealed credentials, keyed by key guid.
  private statusByGuid = signal<Record<string, RowStatus>>({});
  private credentialsByGuid = signal<Record<string, string>>({});

  rowStatus = (guid: string): RowStatus => this.statusByGuid()[guid] ?? 'idle';
  revealedCredentials = (guid: string): string | undefined => this.credentialsByGuid()[guid];

  constructor() {
    const route = inject(ActivatedRoute);
    this.cfGuid = route.snapshot.params.endpointId;
    this.siGuid = route.snapshot.params.serviceInstanceId;
    this.instanceSource = this.catalog.serviceInstance(this.cfGuid, this.siGuid);
    this.reload();
  }

  reload(): void {
    this.keysSource.set(this.catalog.serviceKeysForInstance(this.cfGuid, this.siGuid));
  }

  async createKey(): Promise<void> {
    const name = this.newKeyName().trim();
    if (!name || this.creating()) {
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
      this.reload();
    } catch (err: unknown) {
      this.errorMessage.set(`Failed to create key: ${this.messageOf(err)}`);
    } finally {
      this.creating.set(false);
    }
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

  async revealCredentials(guid: string): Promise<void> {
    if (this.revealedCredentials(guid) !== undefined) {
      // Toggle off.
      this.credentialsByGuid.update(prev => {
        const next = { ...prev };
        delete next[guid];
        return next;
      });
      return;
    }
    try {
      const details = await firstValueFrom(
        this.http.get<KeyDetailsResponse>(`/pp/v1/cf/service_keys/${this.cfGuid}/${guid}/details`),
      );
      const creds = JSON.stringify(details?.credentials ?? {}, null, 2);
      this.credentialsByGuid.update(prev => ({ ...prev, [guid]: creds }));
    } catch (err: unknown) {
      this.errorMessage.set(`Failed to load credentials: ${this.messageOf(err)}`);
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
