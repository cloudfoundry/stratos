import { CommonModule, AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from "@angular/core";
import {
	type EndpointModel,
	getFullEndpointApiUrl,
	stratosEntityCatalog,
} from "@stratosui/store";
import type { Observable } from "rxjs";
import { map } from "rxjs/operators";

import { CopyToClipboardComponent } from "../../../../copy-to-clipboard/copy-to-clipboard.component";
import { TableCellCustom } from "../../../list.types";
import type { RowWithEndpointId } from "../table-cell-endpoint-name/table-cell-endpoint-name.component";

@Component({
	selector: "app-table-cell-endpoint-address",
	templateUrl: "./table-cell-endpoint-address.component.html",
	styleUrls: ["./table-cell-endpoint-address.component.scss"],
	standalone: true,
	imports: [CommonModule, CopyToClipboardComponent],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableCellEndpointAddressComponent extends TableCellCustom<
	EndpointModel | RowWithEndpointId
> {
	public endpointAddress$!: Observable<string>;

	@Input("row")
	set row(row: EndpointModel | RowWithEndpointId) {
		super.row = row;
		const id = "endpointId" in row ? row.endpointId : row.guid;
		this.endpointAddress$ = stratosEntityCatalog.endpoint.store
			.getEntityService(id)
			.waitForEntity$.pipe(
				map((data) => data.entity),
				map((data: EndpointModel) => getFullEndpointApiUrl(data)),
			);
	}
}
