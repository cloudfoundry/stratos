import { ChangeDetectionStrategy, Component, TemplateRef, viewChild } from '@angular/core';

@Component({
  selector: 'app-meta-card-key',
  templateUrl: './meta-card-key.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: []
})
export class MetaCardKeyComponent {

  readonly content = viewChild.required(TemplateRef);

}
