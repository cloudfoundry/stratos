import { Component } from '@angular/core';

@Component({
  selector: 'app-panel',
  templateUrl: './panel.component.html',
  styleUrls: ['./panel.component.scss'],
  /* tslint:disable-next-line:use-input-property-decorator */
  inputs: ['title', 'background', 'container', 'border']
})
export class PanelComponent {
  // Title of the panel
  public title = '';
  // Display a gray background
  public background = false;
  // Show a border
  public border = false;
  // Set the size of the panel to 80%
  public container = false;
}
