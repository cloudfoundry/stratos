import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Output,
  Signal,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { of as observableOf } from 'rxjs';

import {
  BoundListSelectionState,
  ListSelectionStore,
  SignalStepHandle,
} from '@stratosui/core';
import { ServiceCatalogDataService, SignalSource } from '../../../../services/endpoint-data/service-catalog-data.service';
import { StServiceCredentialBinding } from '../../../../services/endpoint-data/stratos-types';

interface DetachAppRow {
  binding: StServiceCredentialBinding;
  appName: string;
  bindingDate: string;
}

@Component({
  selector: 'app-detach-apps',
  templateUrl: './detach-apps.component.html',
  host: { class: 'app-host-flex-1' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [],
  providers: [
    DatePipe,
    ListSelectionStore,
  ],
})
export class DetachAppsComponent {
  private datePipe = inject(DatePipe);
  private serviceCatalog = inject(ServiceCatalogDataService);
  private selectionStore = inject<ListSelectionStore<StServiceCredentialBinding>>(ListSelectionStore);

  @Output() selectedApps = new EventEmitter<StServiceCredentialBinding[]>();

  private bindingsSource: SignalSource<StServiceCredentialBinding[]>;
  selection: BoundListSelectionState<StServiceCredentialBinding>;

  readonly isLoading: Signal<boolean>;
  readonly rows: Signal<DetachAppRow[]>;
  readonly bindings: Signal<StServiceCredentialBinding[]>;

  signalHandle: SignalStepHandle;

  constructor() {
    const activatedRoute = inject(ActivatedRoute);
    const { serviceInstanceId, endpointId } = activatedRoute.snapshot.params;

    this.bindingsSource = this.serviceCatalog.serviceBindingsForInstance(endpointId, serviceInstanceId);
    this.selection = this.selectionStore.bind(b => b.guid);

    this.isLoading = this.bindingsSource.isLoading;
    this.bindings = computed(() => this.bindingsSource.value() ?? []);
    this.rows = computed(() => this.bindings().map(b => ({
      binding: b,
      appName: b.app?.name ?? '',
      bindingDate: this.datePipe.transform(b.createdAt, 'medium') ?? '',
    })));

    this.signalHandle = { valid: this.selection.isSelecting };

    // Emit the current selection upstream whenever it changes. The parent
    // step reads this list in its confirm phase to drive per-binding deletes.
    effect(() => {
      const selected = Array.from(this.selection.selectedRows().values());
      this.selectedApps.emit(selected);
    });
  }

  isAllSelected = computed(() => this.selection.isAllSelected(this.bindings()));

  toggleAll(): void {
    if (this.isAllSelected()) {
      this.selection.clear();
    } else {
      this.selection.selectAll(this.bindings());
    }
  }

  isRowSelected(b: StServiceCredentialBinding): boolean {
    return this.selection.selectedRows().has(b.guid);
  }

  toggleRow(b: StServiceCredentialBinding): void {
    this.selection.toggle(b);
  }

  onNext = () => observableOf({ success: true });
}
