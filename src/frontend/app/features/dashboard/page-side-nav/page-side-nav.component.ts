import { Component, OnInit, Input } from '@angular/core';
import { Observable } from 'rxjs';

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

  constructor() { }

  ngOnInit() {
  }

}
