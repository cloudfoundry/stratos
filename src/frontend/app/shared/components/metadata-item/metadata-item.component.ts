import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-metadata-item',
  templateUrl: './metadata-item.component.html',
  styleUrls: ['./metadata-item.component.scss']
})
export class MetadataItemComponent {

  constructor() { }

  @Input() public icon: string;

  @Input() public iconFont: string;

  @Input() public label: string;

  @Input() public tooltip: string;

  // Are we editing?
  @Input() public edit: boolean;

}
