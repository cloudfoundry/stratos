import { AsyncPipe, CommonModule, NgClass } from "@angular/common";
import {
	ChangeDetectionStrategy,
	Component,
	Input,
	type OnInit,
} from "@angular/core";
import { ActivatedRoute, RouterLink, RouterLinkActive, RouterModule } from "@angular/router";
import { Store } from "@ngrx/store";
import { type Observable, of } from "rxjs";
import { map } from "rxjs/operators";

import type { AppState } from "../../../../../store/src/app-state";
import { EntityServiceFactory } from "../../../../../store/src/entity-service-factory.service";
import { selectIsMobile } from "../../../../../store/src/selectors/dashboard.selectors";
import type { StratosTabMetadata } from "../../../core/extension/extension-service";
import { CurrentUserPermissionsService } from "../../../core/permissions/current-user-permissions.service";
import type { IBreadcrumb } from "../../../shared/components/breadcrumbs/breadcrumbs.types";
import { CustomIconComponent } from "../../../shared/components/custom-material/custom-material.component";
import { TabNavService } from "../../../tab-nav.service";

export interface IPageSideNavTab extends StratosTabMetadata {
	hidden$?: Observable<boolean>;
}

@Component({
	selector: "app-page-side-nav",
	templateUrl: "./page-side-nav.component.html",
	styleUrls: ["./page-side-nav.component.scss"],
	standalone: true,
	imports: [
		CommonModule,
		RouterModule,
		AsyncPipe,
		NgClass,
		RouterLink,
		RouterLinkActive,
		CustomIconComponent
	],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageSideNavComponent implements OnInit {
	pTabs: IPageSideNavTab[] = [];
	@Input() set tabs(tabs: IPageSideNavTab[]) {
		if (!tabs) {
			this.pTabs = [];
			return;
		}
		if (this.pTabs && tabs.length === this.pTabs.length) {
			return;
		}
		this.pTabs = tabs.map((tab) => ({
			...tab,
			hidden$:
				tab.hidden$ ||
				(tab.hidden
					? tab.hidden(this.store, this.esf, this.activatedRoute, this.cups)
					: of(false)),
		}));
	}
	get tabs(): IPageSideNavTab[] {
		return this.pTabs;
	}

	@Input()
	public header!: string;
	public activeTab$!: Observable<string>;
	public breadcrumbs$!: Observable<IBreadcrumb[]>;
	public isMobile$: Observable<boolean>;
	constructor(
		public tabNavService: TabNavService,
		private store: Store<AppState>,
		private esf: EntityServiceFactory,
		private activatedRoute: ActivatedRoute,
		private cups: CurrentUserPermissionsService,
	) {
		this.isMobile$ = this.store.select(selectIsMobile);
	}

	ngOnInit() {
		this.activeTab$ = this.tabNavService
			.getCurrentTabHeaderObservable()
			.pipe(map((item: { label?: string }) => (item ? item.label : null)));
	}
}
