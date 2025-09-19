import { Component } from '@angular/core';

@Component({
selector: 'app-list-filters',
  templateUrl: './list-filters.component.html',
  styleUrls: ['./list-filters.component.scss'],
  /* tslint:disable-next-line:no-inputs-metadata-property */
  inputs: ['filters'],
  standalone: false
})

export class ListFiltersComponent {
  public filters: { title: string, items: Array<{}>, }[] = [];
}
