import { Component, OnInit } from '@angular/core';
import { Input, ChangeDetectionStrategy } from '@angular/core';
import { ISubHeaderTabs } from './page-subheader.types';

@Component({
  selector: 'app-page-subheader',
  templateUrl: './page-subheader.component.html',
  styleUrls: ['./page-subheader.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PageSubheaderComponent implements OnInit {
  @Input('tabs')
  tabs: ISubHeaderTabs[];

  constructor() { }

  ngOnInit() {
  }

}
