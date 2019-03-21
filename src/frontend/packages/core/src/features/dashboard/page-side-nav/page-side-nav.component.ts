import { Component, OnInit, Input } from '@angular/core';
import { Observable } from 'rxjs';
import { IBreadcrumb } from '../../../shared/components/breadcrumbs/breadcrumbs.types';
import { TabNavService } from '../../../../tab-nav.service';

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

  constructor(public tabNavService: TabNavService) { }

  ngOnInit() {
    this.activeTab$ = this.tabNavService.getCurrentTabHeaderObservable();
  }

}
