import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-list-item',
  templateUrl: './list-item.component.html',
  styleUrls: ['./list-item.component.scss'],
  /* tslint:disable-next-line:use-input-property-decorator */
  inputs: ['detailUrl']
})
export class ListItemComponent {

  @Input() height = 'default';

  public detailUrl: string;
}
