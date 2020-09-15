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

  // Does the item have a value to copy to the clipboard? = show the copy button
  @Input() public clipboardValue: string;

}
