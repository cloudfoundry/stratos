import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CustomTooltipDirective } from '../custom-tooltip/custom-tooltip.directive';

import { CopyToClipboardComponent } from '../copy-to-clipboard/copy-to-clipboard.component';
import { CustomIconComponent } from '../custom-material/custom-material.component';

@Component({
  selector: 'app-metadata-item',
  templateUrl: './metadata-item.component.html',
  styleUrls: ['./metadata-item.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    CustomIconComponent,
    CustomTooltipDirective,
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
