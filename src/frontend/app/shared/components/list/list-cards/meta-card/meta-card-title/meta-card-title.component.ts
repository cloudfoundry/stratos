import { ChangeDetectionStrategy, Component, OnInit, Input, TemplateRef, ViewChild } from '@angular/core';

@Component({
  selector: 'app-meta-card-title',
  templateUrl: './meta-card-title.component.html',
  styleUrls: ['./meta-card-title.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MetaCardTitleComponent implements OnInit {

  @ViewChild(TemplateRef)
  content: TemplateRef<any>;

  @Input() noMargin;

  constructor() { }

  ngOnInit() {
  }

}
