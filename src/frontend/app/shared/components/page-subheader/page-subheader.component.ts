import { ChangeDetectionStrategy, Component, Input, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';

import { ISubHeaderTabs } from './page-subheader.types';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-page-subheader',
  templateUrl: './page-subheader.component.html',
  styleUrls: ['./page-subheader.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PageSubheaderComponent implements OnInit, OnDestroy {
  cssClass: string;

  // Deprecated - use tab$ instead
  @Input('tabs')
  tabs: ISubHeaderTabs[];

  @Input('tabs$')
  tabs$: Observable<ISubHeaderTabs[]>;

  @Input('nested')
  nested: boolean;

  sub: Subscription;

  className: string;
  constructor(
    private cd: ChangeDetectorRef
  ) {
    this.className = this.nested ? 'nested-tab' : 'page-subheader';
    if (!!this.tabs) {
      this.cssClass = this.nested ? 'nested-tab__tabs' : 'page-subheader__tabs';
    }
  }

  ngOnInit() {
    if (this.tabs$) {
      this.sub = this.tabs$.subscribe((tabs) => {
        this.tabs = tabs;
        this.cd.detectChanges();
      });
    }
  }

  ngOnDestroy() {
    if (this.sub) {
      this.sub.unsubscribe();
    }
  }

}
