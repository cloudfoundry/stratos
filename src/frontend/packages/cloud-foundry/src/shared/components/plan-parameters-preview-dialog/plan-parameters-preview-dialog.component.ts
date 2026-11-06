import { ChangeDetectionStrategy, Component, Signal, computed, inject } from '@angular/core';

import { MAT_DIALOG_DATA, TailwindDialogRef } from '@stratosui/core';

import { JsonViewerComponent } from '../../../../../core/src/shared/components/json-viewer/json-viewer.component';
import { ServiceCatalogDataService, SignalSource } from '../../../services/endpoint-data/service-catalog-data.service';
import type { StServicePlan } from '../../../services/endpoint-data/stratos-types';
import { extractCreateParameters, previewSchema } from './plan-parameters-preview.util';

/** Input to the dialog: which plan to fetch + show. */
export interface PlanParametersPreviewData {
  cnsiGuid: string;
  planGuid: string;
  planName?: string;
}

/**
 * PlanParametersPreviewDialogComponent — read-only preview of a service plan's
 * create-instance parameter schema, opened from the marketplace Plans tab so a
 * user can see what they'd configure BEFORE committing to the create wizard
 * (#5493).
 *
 * The plans list is summary-tier (no `schemas`), so this fetches the one plan
 * at `?return=details` on open and renders the schema as a read-only json-viewer
 * tree. No schema → "no configurable parameters". Read-only: no editor, the
 * schema is broker-defined and not something to change here.
 */
@Component({
  selector: 'app-plan-parameters-preview-dialog',
  templateUrl: './plan-parameters-preview-dialog.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [JsonViewerComponent],
})
export class PlanParametersPreviewDialogComponent {
  private readonly dialogRef = inject<TailwindDialogRef<PlanParametersPreviewDialogComponent>>(TailwindDialogRef);
  private readonly data = inject<PlanParametersPreviewData>(MAT_DIALOG_DATA);
  private readonly serviceCatalog = inject(ServiceCatalogDataService);

  private readonly source: SignalSource<StServicePlan | null> =
    this.serviceCatalog.servicePlan(this.data.cnsiGuid, this.data.planGuid);

  readonly title = this.data.planName ? `Parameters — ${this.data.planName}` : 'Plan parameters';
  readonly loading: Signal<boolean> = this.source.isLoading;
  readonly error: Signal<boolean> = computed(() => this.source.error() != null);

  /** Cleaned create-parameters schema, or null when the plan advertises none. */
  readonly schema: Signal<object | null> = computed(() =>
    previewSchema(extractCreateParameters(this.source.value())),
  );

  close(): void {
    this.dialogRef.close();
  }
}
