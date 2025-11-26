import { ChangeDetectionStrategy, Component} from '@angular/core';

import type { PreviewableComponent } from '../../../../../core/src/shared/previewable-component';
import { SidepanelPreviewComponent } from '../../../../../core/src/shared/components/sidepanel-preview/sidepanel-preview.component';
import type { ResourceAlert } from '../../services/analysis-report.types';

interface ResourceWithKind {
  kind: string;
  [key: string]: unknown;
}

@Component({
changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-resource-alert-preview',
  templateUrl: './resource-alert-preview.component.html',
  styleUrls: ['./resource-alert-preview.component.scss'],
  standalone: true,
  imports: [
    SidepanelPreviewComponent
  ]
})
export class ResourceAlertPreviewComponent implements PreviewableComponent {

  title!: string;

  resource!: ResourceWithKind;
  alerts!: ResourceAlert[];

  setProps(props: { [key: string]: unknown }): void {
    this.resource = props.resource as ResourceWithKind;
    this.title = `${this.resource.kind} Alerts`;
  }

}
