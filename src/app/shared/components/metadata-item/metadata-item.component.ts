import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-metadata-item',
  templateUrl: './metadata-item.component.html',
  styleUrls: ['./metadata-item.component.scss']
})
export class MetadataItemComponent implements OnInit {

  constructor() { }

  @Input('icon') private icon: string;

  @Input('label') private label: string;

  ngOnInit() {
  }

}
