import { ChangeDetectionStrategy, Component, Input, TemplateRef, ViewChild } from '@angular/core';

@Component({
  selector: 'app-meta-card-title',
  templateUrl: './meta-card-title.component.html',
  styleUrls: ['./meta-card-title.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MetaCardTitleComponent {

  @ViewChild(TemplateRef, { static: true })
  content: TemplateRef<any>;

  @Input() noMargin;

}
