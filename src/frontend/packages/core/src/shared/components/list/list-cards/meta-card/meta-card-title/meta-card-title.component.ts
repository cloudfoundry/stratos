import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, TemplateRef, ViewChild } from '@angular/core';

@Component({
  selector: 'app-meta-card-title',
  templateUrl: './meta-card-title.component.html',
  styleUrls: ['./meta-card-title.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule
  ]
})
export class MetaCardTitleComponent {

  @ViewChild(TemplateRef, { static: true })
  content!: TemplateRef<unknown>;

  @Input() noMargin!: boolean;

}
