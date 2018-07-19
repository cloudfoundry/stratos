import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-metadata-item',
  templateUrl: './metadata-item.component.html',
  styleUrls: ['./metadata-item.component.scss']
})
export class MetadataItemComponent implements OnInit {

  constructor() { }

  @Input('icon') public icon: string;

  @Input('iconFont') public iconFont: string;

  @Input('label') public label: string;

  @Input('tooltip') public tooltip: string;

  // Are we editing?
  @Input('edit') public edit: boolean;

  ngOnInit() {
  }

}
