import { AsyncPipe, DatePipe, NgClass } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, signal, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';

import {
  PageHeaderComponent,
  SignalStepHandle,
  StepComponent,
  SteppersComponent,
} from '@stratosui/core';
import { APIResource } from '@stratosui/store';
import { IServiceBinding } from '../../../cf-api-svc.types';
import { cfEntityCatalog } from '../../../cf-entity-catalog';
import { StratosJobError } from '../../../services/async-jobs/async-job.types';
import { writeWithJob } from '../../../services/async-jobs/write-with-job';
import { DetachAppsComponent } from './detach-apps/detach-apps.component';

type BindingStatus = 'pending' | 'busy' | 'success' | 'error';

interface BindingRow {
  guid: string;
  appName: string;
  appGuid: string;
  bindingDate: string;
  status: BindingStatus;
  errorMessage?: string;
}

@Component({
  selector: 'app-detach-service-instance',
  templateUrl: './detach-service-instance.component.html',
  styleUrls: ['./detach-service-instance.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AsyncPipe,
    NgClass,
    PageHeaderComponent,
    SteppersComponent,
    StepComponent,
    DetachAppsComponent,
  ],
  providers: [DatePipe]
})
export class DetachServiceInstanceComponent {
  private datePipe = inject(DatePipe);
  private router = inject(Router);
  private http = inject(HttpClient);


  title$!: Observable<string>;
  cfGuid!: string;
  deleteStarted = signal(false);

  // Per-binding write status, keyed by binding guid. Replaces the
  // ngrx-coupled <app-action-monitor> wiring: writeWithJob promises
  // resolve into this map and the template re-renders from it.
  private statusByGuid = signal<Record<string, BindingStatus>>({});
  private errorByGuid = signal<Record<string, string>>({});
  // Selected bindings, set by the upstream <app-detach-apps> step.
  private _selectedBindings = signal<APIResource<IServiceBinding>[]>([]);

  rows = computed<BindingRow[]>(() => {
    const bindings = this._selectedBindings();
    const statuses = this.statusByGuid();
    const errors = this.errorByGuid();
    return bindings.map(b => ({
      guid: b.metadata.guid,
      appName: b.entity.app.entity.name,
      appGuid: b.entity.app.metadata.guid,
      bindingDate: this.datePipe.transform(b.metadata.created_at, 'medium') ?? '',
      status: statuses[b.metadata.guid] ?? 'pending',
      errorMessage: errors[b.metadata.guid],
    }));
  });

  // Always valid: the user already picked ≥1 binding in the prior step.
  // Submit dispatches one v3 DELETE per binding via writeWithJob, tracking
  // each row's outcome in `statusByGuid`. Re-click after deleteStarted
  // navigates to /services.
  confirmStepHandle: SignalStepHandle = {
    valid: signal(true).asReadonly(),
    submit: async () => {
      if (this.deleteStarted()) {
        await this.router.navigate(['/services']);
        return;
      }
      this.deleteStarted.set(true);
      const bindings = this._selectedBindings();
      if (bindings.length === 0) return;

      // Mark every row busy up-front so the user sees progress immediately
      // even if the network is slow.
      this.statusByGuid.update(prev => {
        const next = { ...prev };
        for (const b of bindings) next[b.metadata.guid] = 'busy';
        return next;
      });

      // Fire all deletes in parallel; settle whichever way each lands.
      await Promise.all(bindings.map(b => this.detachOne(b.metadata.guid)));
    },
  };

  constructor() {
    const activatedRoute = inject(ActivatedRoute);

    this.cfGuid = activatedRoute.snapshot.params.endpointId;
    const serviceInstanceId = activatedRoute.snapshot.params.serviceInstanceId;
    this.title$ = cfEntityCatalog.serviceInstance.store.getEntityService(serviceInstanceId, this.cfGuid).waitForEntity$.pipe(
      filter(o => !!o && !!o.entity),
      map(o => `Unbind apps from '${o.entity.entity.name}'`),
    );
  }

  setSelectedBindings = (selectedBindings: APIResource<IServiceBinding>[]) => {
    this._selectedBindings.set(selectedBindings);
  }

  private async detachOne(bindingGuid: string): Promise<void> {
    try {
      const call = this.http.delete(
        `/pp/v1/cf/service_bindings/${this.cfGuid}/${bindingGuid}`,
        { observe: 'response' as const },
      );
      await writeWithJob(this.http, call);
      this.statusByGuid.update(prev => ({ ...prev, [bindingGuid]: 'success' }));
    } catch (err: unknown) {
      const message = err instanceof StratosJobError
        ? err.message
        : err instanceof Error
          ? err.message
          : 'unknown error';
      this.statusByGuid.update(prev => ({ ...prev, [bindingGuid]: 'error' }));
      this.errorByGuid.update(prev => ({ ...prev, [bindingGuid]: message }));
    }
  }

}
