import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

import { CopyToClipboardComponent } from '../copy-to-clipboard/copy-to-clipboard.component';

@Component({
  selector: 'app-metadata-item',
  templateUrl: './metadata-item.component.html',
  styleUrls: ['./metadata-item.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatTooltipModule,
    CopyToClipboardComponent
  ]
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
