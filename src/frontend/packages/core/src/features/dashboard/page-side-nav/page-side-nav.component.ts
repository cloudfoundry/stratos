import { Component, OnInit, Input } from '@angular/core';
import { Observable } from 'rxjs';
import { IBreadcrumb } from '../../../shared/components/breadcrumbs/breadcrumbs.types';
import { TabNavService } from '../../../../tab-nav.service';
import { Store } from '@ngrx/store';
import { AppState } from '../../../../../store/src/app-state';
import { selectIsMobile } from '../../../../../store/src/selectors/dashboard.selectors';

export interface IPageSideNavTab {
  key?: string;
  label: string;
  matIcon?: string;
  matIconFont?: string;
  link: string;
  hidden?: Observable<boolean>;
}

@Component({
  selector: 'app-page-side-nav',
  templateUrl: './page-side-nav.component.html',
  styleUrls: ['./page-side-nav.component.scss']
})
export class PageSideNavComponent implements OnInit {

  @Input()
  public tabs: IPageSideNavTab[];

  @Input()
  public header: string;
  public activeTab$: Observable<string>;
  public breadcrumbs$: Observable<IBreadcrumb[]>;
  public isMobile$ = this.store.select(selectIsMobile);

  constructor(
    public tabNavService: TabNavService,
    private store: Store<Pick<AppState, 'dashboard'>>
  ) { }

  ngOnInit() {
    this.activeTab$ = this.tabNavService.getCurrentTabHeaderObservable();
  }

}
