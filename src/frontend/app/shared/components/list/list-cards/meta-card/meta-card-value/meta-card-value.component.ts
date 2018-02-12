import { Component, OnInit, ViewChild, TemplateRef } from '@angular/core';
import { ChangeDetectionStrategy } from '@angular/compiler/src/core';

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
