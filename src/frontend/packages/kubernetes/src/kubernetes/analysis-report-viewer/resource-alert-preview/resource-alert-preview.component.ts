import { Component } from '@angular/core';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIcon } from '@angular/material/icon';
import { PreviewableComponent } from 'frontend/packages/core/src/shared/previewable-component';

@Component({
selector: 'app-resource-alert-preview',
  templateUrl: './resource-alert-preview.component.html',
  styleUrls: ['./resource-alert-preview.component.scss'],
  standalone: true,
  imports: [
    MatExpansionModule,
    MatIcon
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
