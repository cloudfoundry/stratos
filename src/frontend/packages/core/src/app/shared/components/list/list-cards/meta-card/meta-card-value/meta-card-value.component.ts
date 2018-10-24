import { ChangeDetectionStrategy, Component, OnInit, TemplateRef, ViewChild } from '@angular/core';

@Component({
  selector: 'app-meta-card-value',
  templateUrl: './meta-card-value.component.html',
  styleUrls: ['./meta-card-value.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MetaCardValueComponent implements OnInit {

  @ViewChild(TemplateRef)
  content: TemplateRef<any>;

  constructor() { }

  ngOnInit() {
  }

}
