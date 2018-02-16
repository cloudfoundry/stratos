import { ChangeDetectionStrategy, Component, OnInit, TemplateRef, ViewChild } from '@angular/core';

@Component({
  selector: 'app-meta-card-key',
  templateUrl: './meta-card-key.component.html',
  styleUrls: ['./meta-card-key.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MetaCardKeyComponent implements OnInit {

  @ViewChild(TemplateRef)
  content: TemplateRef<any>;

  constructor() { }

  ngOnInit() {
  }

}
