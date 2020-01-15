import { Component, Input } from '@angular/core';
import { PanelPreviewService } from '../../services/panel-preview.service';
import { first } from 'rxjs/operators';

@Component({
  selector: 'app-sidepanel-preview',
  templateUrl: './sidepanel-preview.component.html',
  styleUrls: ['./sidepanel-preview.component.scss']
})
export class SidepanelPreviewComponent {

  @Input()
  title: string;

  constructor(public previewService: PanelPreviewService) { }
}
