import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, TemplateRef, input, viewChild } from '@angular/core';

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

  readonly content = viewChild.required(TemplateRef);

  readonly noMargin = input<boolean>();

}
