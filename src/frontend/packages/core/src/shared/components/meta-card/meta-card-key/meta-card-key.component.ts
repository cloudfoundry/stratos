import { ChangeDetectionStrategy, Component, TemplateRef, ViewChild } from '@angular/core';

@Component({
  selector: 'app-meta-card-key',
  templateUrl: './meta-card-key.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: []
})
export class MetaCardKeyComponent {

  @ViewChild(TemplateRef, { static: true })
  content!: TemplateRef<any>;

}
