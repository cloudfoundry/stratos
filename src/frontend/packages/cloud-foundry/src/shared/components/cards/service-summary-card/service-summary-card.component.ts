import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, computed, signal } from '@angular/core';

import {
  AppChip,
  AppChipsComponent,
  BooleanIndicatorComponent,
  ClickStopPropagationDirective,
  MetaCardComponent,
  MetaCardItemComponent,
  MetaCardKeyComponent,
  MetaCardTitleComponent,
  MetaCardValueComponent,
} from '@stratosui/core';
import { of } from 'rxjs';

import { StServiceOffering } from '../../../../services/endpoint-data/stratos-types';

interface SummaryView {
  description: string;
  available: boolean;
  shareable: boolean;
  documentationUrl: string;
  tags: AppChip<string>[];
}

/**
 * ServiceSummaryCardComponent — service-offering Summary tab "Summary" card.
 *
 * Stage 9b-2: rewritten to consume the V3-native StServiceOffering passed
 * down from the parent ServiceSummaryComponent. The legacy V2 entity
 * surfaced `bindable` + `active` as separate booleans; V3 collapses these
 * into `available` (catalog-listed and provisionable) — we render that as
 * the single "Available" indicator. `shareable` (V3 surface; was missing
 * from the V2 card) is exposed as a second indicator since it materially
 * affects what users can do with instances.
 *
 * Service icon (legacy `extra.imageUrl`) is dropped: V3 doesn't surface
 * the open-service-broker `extra` JSON blob in StServiceOffering. Will be
 * reinstated when StServiceOffering projects brokerCatalogMetadata
 * (currently typed as `{ [k: string]: unknown }` so consumers can't
 * statically read `imageUrl`).
 */
@Component({
  selector: 'app-service-summary-card',
  templateUrl: './service-summary-card.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    MetaCardComponent,
    MetaCardTitleComponent,
    MetaCardItemComponent,
    MetaCardKeyComponent,
    MetaCardValueComponent,
    BooleanIndicatorComponent,
    AppChipsComponent,
    ClickStopPropagationDirective,
  ],
})
export class ServiceSummaryCardComponent {
  private readonly _offering = signal<StServiceOffering | null>(null);

  @Input()
  set offering(value: StServiceOffering | null) {
    this._offering.set(value ?? null);
  }
  get offering(): StServiceOffering | null {
    return this._offering();
  }

  readonly view = computed<SummaryView>(() => {
    const o = this._offering();
    if (!o) {
      return {
        description: '',
        available: false,
        shareable: false,
        documentationUrl: '',
        tags: [],
      };
    }
    return {
      description: o.description ?? '',
      available: !!o.available,
      shareable: !!o.shareable,
      documentationUrl: o.documentationUrl ?? '',
      tags: (o.tags ?? []).map(t => ({
        value: t,
        // Tag chips on the summary card are decorative; suppress the chip
        // clear button so users don't get a visual affordance that does
        // nothing.
        hideClearButton$: of(true),
      })),
    };
  });
}
