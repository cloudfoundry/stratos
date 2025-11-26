import { CommonModule, DatePipe, JsonPipe, AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, type OnInit, inject } from "@angular/core";
import { DomSanitizer, type SafeUrl } from "@angular/platform-browser";
import { ActivatedRoute, RouterModule } from "@angular/router";
import { Store } from "@ngrx/store";
import {
	type AppState,
	type EndpointModel,
	endpointEntityType,
	getPreviousRoutingState,
	InternalEventMonitorFactory,
	type InternalEventState,
	SendClearEndpointEventsAction,
	StratosStatus,
	stratosEntityCatalog,
} from "@stratosui/store";
import { type Observable, of } from "rxjs";
import { first, map, withLatestFrom } from "rxjs/operators";
import { StatefulIconComponent } from "../../../core/stateful-icon/stateful-icon.component";
import { MetadataItemComponent } from "../../../shared/components/metadata-item/metadata-item.component";
import { PageHeaderComponent } from "../../../shared/components/page-header/page-header.component";
import { eventReturnUrlParam } from "../../event-page/events-page/events-page.component";

@Component({
	selector: "app-error-page",
	templateUrl: "./error-page.component.html",
	styleUrls: ["./error-page.component.scss"],
	standalone: true,
	imports: [
		CommonModule,
		AsyncPipe,
		DatePipe,
		JsonPipe,
		RouterModule,
		PageHeaderComponent,
		StatefulIconComponent,
		MetadataItemComponent,
	],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ErrorPageComponent implements OnInit {
	public back$: Observable<string>;
	public backParams$: Observable<object>;
	public errorDetails$: Observable<{
		endpoint: EndpointModel;
		errors: InternalEventState[];
	}>;
	public icon = StratosStatus.ERROR;
	public jsonDownloadHref$: Observable<SafeUrl>;

	private activatedRoute = inject(ActivatedRoute);
	private store = inject(Store<AppState>);
	private internalEventMonitorFactory = inject(InternalEventMonitorFactory);
	private sanitizer = inject(DomSanitizer);

	public dismissEndpointErrors(endpointGuid: string) {
		this.store.dispatch(new SendClearEndpointEventsAction(endpointGuid));
	}

	ngOnInit() {
		const endpointId = this.activatedRoute.snapshot.params.endpointId;
		if (endpointId) {
			const endpointMonitor =
				stratosEntityCatalog.endpoint.store.getEntityMonitor(endpointId);
			const cfEndpointEventMonitor =
				this.internalEventMonitorFactory.getMonitor(
					endpointEntityType,
					of([endpointId]),
				);
			this.errorDetails$ = cfEndpointEventMonitor
				.hasErroredOverTimeNoPoll(30)
				.pipe(
					withLatestFrom(endpointMonitor.entity$),
					map(([errors, endpoint]) => {
						return {
							endpoint,
							errors: errors ? errors[endpointId] : null,
						};
					}),
				);
			this.jsonDownloadHref$ = this.errorDetails$.pipe(
				map((info: unknown) => {
					const jsonString = JSON.stringify(info);
					return this.sanitizer.bypassSecurityTrustUrl(
						`data:text/json;charset=UTF-8,${encodeURIComponent(jsonString)}`,
					);
				}),
			);
		}
	}

	constructor() {
		this.back$ = this.store
			.select(getPreviousRoutingState)
			.pipe(first())
			.pipe(
				map((previousState: any) =>
					previousState && previousState.url !== "/login"
						? previousState.url.split("?")[0]
						: "/home",
				),
			);

		this.backParams$ = this.back$.pipe(
			map((urlBack: string) => {
				// If we've come from the events page ensure we pass it back it's param
				const overrideReturnUrl =
					this.activatedRoute.snapshot.queryParams[eventReturnUrlParam];
				return urlBack?.startsWith("/events")
					? {
							[eventReturnUrlParam]: overrideReturnUrl || null,
						}
					: {};
			}),
			first(),
		);
	}
}
