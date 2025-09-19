import { ChangeDetectionStrategy, Component, TemplateRef, ViewChild } from '@angular/core';

@Component({
selector: 'app-meta-card-value',
  templateUrl: './meta-card-value.component.html',
  styleUrls: ['./meta-card-value.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false
})
export class MetaCardValueComponent {
  @ViewChild(TemplateRef, { static: true })
  content: TemplateRef<any>;
}
