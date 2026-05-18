import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, Input, OnInit, inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { AppState, EntityServiceFactory, Store } from '@stratosui/store';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { StratosTabMetadata } from '../../../core/extension/extension-service';
import { CurrentUserPermissionsService } from '../../../core/permissions/current-user-permissions.service';
import { DashboardSignalService } from '../../../core/signals/dashboard-signal.service';
import { IBreadcrumb } from '../../../shared/components/breadcrumbs/breadcrumbs.types';
import { TabNavService } from '../../../tab-nav.service';
import { CustomIconComponent } from '../../../shared/components/custom-material/custom-material.component';



export interface IPageSideNavTab extends StratosTabMetadata {
  hidden$?: Observable<boolean>;
}

@Component({
  selector: 'app-page-side-nav',
  templateUrl: './page-side-nav.component.html',
  styleUrls: ['./page-side-nav.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    CustomIconComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PageSideNavComponent implements OnInit {
  tabNavService = inject(TabNavService);
  private store = inject<Store<AppState>>(Store);
  private esf = inject(EntityServiceFactory);
  private activatedRoute = inject(ActivatedRoute);
  private cups = inject(CurrentUserPermissionsService);
  private http = inject(HttpClient);
  private dashboardSignals = inject(DashboardSignalService);


  pTabs: IPageSideNavTab[] = [];
  @Input() set tabs(tabs: IPageSideNavTab[]) {
    if (!tabs) {
      this.pTabs = [];
      return;
    }
    if (this.pTabs && tabs.length === this.pTabs.length) {
      return;
    }
    this.pTabs = tabs.map(tab => ({
      ...tab,
      hidden$: tab.hidden$ || (tab.hidden ? tab.hidden(this.store, this.esf, this.activatedRoute, this.cups, this.http) : of(false))
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
  constructor() {
    this.isMobile$ = toObservable(this.dashboardSignals.isMobile);
  }

  ngOnInit() {
    this.activeTab$ = this.tabNavService.getCurrentTabHeaderObservable().pipe(map((item: any) => item ? item.label : null));
  }

}
