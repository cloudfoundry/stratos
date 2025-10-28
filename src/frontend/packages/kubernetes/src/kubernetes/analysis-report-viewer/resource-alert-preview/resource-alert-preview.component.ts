import { Component } from '@angular/core';
import { MatExpansionModule } from '@angular/material/expansion';

import { PreviewableComponent } from '../../../../../core/src/shared/previewable-component';
import { SidepanelPreviewComponent } from '../../../../../core/src/shared/components/sidepanel-preview/sidepanel-preview.component';

@Component({
selector: 'app-resource-alert-preview',
  templateUrl: './resource-alert-preview.component.html',
  styleUrls: ['./resource-alert-preview.component.scss'],
  standalone: true,
  imports: [
    MatExpansionModule,
    SidepanelPreviewComponent
  ]
})
export class ResourceAlertPreviewComponent implements PreviewableComponent {

  title: string;

  resource: any;
  alerts: any;

  constructor() { }

  setProps(props: { [key: string]: any, }): void {
    this.resource = props.resource;
    this.title = `${this.resource.kind} Alerts`;
  }

}
