import { CommonModule, AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from "@angular/core";
import { RouterModule } from "@angular/router";
import { CustomTooltipDirective } from "@stratosui/core";
import {
	type EndpointModel,
	entityCatalog,
	stratosEntityCatalog,
} from "@stratosui/store";
import type { Observable } from "rxjs";
import { filter, map } from "rxjs/operators";

import { EndpointsService } from "../../../../../../core/endpoints.service";
import { CustomIconComponent } from "../../../../../../shared/components/custom-material/custom-material.component";
import { TableCellCustom } from "../../../list.types";

export interface RowWithEndpointId {
	endpointId: string;
}

@Component({
	selector: "app-table-cell-endpoint-name",
	templateUrl: "./table-cell-endpoint-name.component.html",
	styleUrls: ["./table-cell-endpoint-name.component.scss"],
	standalone: true,
	imports: [
		CommonModule,
		RouterModule,
		CustomIconComponent,
		CustomTooltipDirective,
	],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableCellEndpointNameComponent extends TableCellCustom<
	EndpointModel | RowWithEndpointId
> {
	public endpoint$!: Observable<
		EndpointModel & { canShowLink: boolean; link: string }
	>;

	@Input("row")
	set row(row: EndpointModel | RowWithEndpointId) {
		super.row = row;
		const id = "endpointId" in row ? row.endpointId : row.guid;
		this.endpoint$ = stratosEntityCatalog.endpoint.store
			.getEntityMonitor(id)
			.entity$.pipe(
				filter((data) => !!data),
				map((data) => {
					const ep = entityCatalog.getEndpoint(
						data.cnsi_type,
						data.sub_type,
					).definition;
					return {
						...data,
						canShowLink:
							data.connectionStatus === "connected" || ep.unConnectable,
						link: EndpointsService.getLinkForEndpoint(data),
					};
				}),
			);
	}
}
