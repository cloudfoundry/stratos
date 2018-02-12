import { Component, OnInit, ViewChild, TemplateRef } from '@angular/core';
import { ChangeDetectionStrategy } from '@angular/compiler/src/core';

@Component({
  selector: 'app-meta-card-title',
  templateUrl: './meta-card-title.component.html',
  styleUrls: ['./meta-card-title.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MetaCardTitleComponent implements OnInit {

  @ViewChild(TemplateRef)
  content: TemplateRef<any>;

  constructor() { }

  ngOnInit() {
  }

}
