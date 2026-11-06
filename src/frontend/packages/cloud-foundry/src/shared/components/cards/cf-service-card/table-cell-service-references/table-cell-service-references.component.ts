import { Component, Input, ChangeDetectionStrategy } from "@angular/core";

import {
  ClickStopPropagationDirective,
  TableCellCustom,
} from "@stratosui/core";
import { StServiceOffering } from "../../../../../services/endpoint-data/stratos-types";

@Component({
  selector: "app-table-cell-service-references",
  templateUrl: "./table-cell-service-references.component.html",
  styleUrls: ["./table-cell-service-references.component.scss"],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ClickStopPropagationDirective],
})
export class TableCellServiceReferencesComponent extends TableCellCustom<StServiceOffering> {
  @Input()
  set row(offering: StServiceOffering) {
    super.row = offering;
  }
  get row(): StServiceOffering {
    return super.row;
  }

  // brokerCatalogMetadata carries the docs/support URL extras that the
  // V2 marketplace read from a JSON-encoded `entity.extra` string.
  // Backend decodes the JSON to a map already; consumers read keys
  // directly. Returns undefined when the broker didn't publish either
  // URL — template @if guards collapse the row in that case.

  hasDocumentationUrl(): boolean {
    return !!this.getDocumentationUrl();
  }
  getDocumentationUrl(): string | undefined {
    return this.row?.brokerCatalogMetadata?.documentationUrl as
      | string
      | undefined;
  }

  hasSupportUrl(): boolean {
    return !!this.getSupportUrl();
  }
  getSupportUrl(): string | undefined {
    return this.row?.brokerCatalogMetadata?.supportUrl as string | undefined;
  }
}
