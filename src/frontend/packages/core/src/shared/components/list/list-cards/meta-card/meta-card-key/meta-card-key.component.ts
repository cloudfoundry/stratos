import { ChangeDetectionStrategy, Component, TemplateRef, ViewChild } from '@angular/core';

@Component({
  selector: 'app-meta-card-key',
  templateUrl: './meta-card-key.component.html',
  styleUrls: ['./meta-card-key.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MetaCardKeyComponent {

  @ViewChild(TemplateRef, { static: true })
  content: TemplateRef<any>;

}
