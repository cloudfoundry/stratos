import { Component, Input } from '@angular/core';
import { NgFor } from '@angular/common';

@Component({
  selector: 'app-list-filters',
  templateUrl: './list-filters.component.html',
  styleUrls: ['./list-filters.component.scss'],
  standalone: true,
  imports: [NgFor]
})

export class ListFiltersComponent {
  @Input() public filters: { title: string, items: Array<{}>, }[] = [];
}
