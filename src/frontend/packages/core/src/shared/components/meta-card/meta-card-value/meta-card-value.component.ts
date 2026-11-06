import { ChangeDetectionStrategy, Component, TemplateRef, viewChild } from '@angular/core';

@Component({
  selector: 'app-meta-card-value',
  templateUrl: './meta-card-value.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: []
})
export class MetaCardValueComponent {
  readonly content = viewChild.required(TemplateRef);
}
