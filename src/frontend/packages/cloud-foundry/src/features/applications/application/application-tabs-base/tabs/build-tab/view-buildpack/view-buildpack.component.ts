import { Component, OnInit, Input, OnChanges } from '@angular/core';

@Component({
  selector: 'app-view-buildpack',
  templateUrl: './view-buildpack.component.html',
  styleUrls: ['./view-buildpack.component.scss']
})
export class ViewBuildpackComponent implements OnInit, OnChanges {

  constructor() { }

  @Input() buildPack: string;
  isWebLink: boolean;

  ngOnInit() { }

  ngOnChanges(values) {
    if (values.buildPack.firstChange || values.buildPack.currentValue !== values.buildPack.previousValue) {
      const buildPack = values.buildPack.currentValue;
      let url = typeof buildPack !== 'undefined' && buildPack ? buildPack : '';
      url = url.trim().toLowerCase();
      this.isWebLink = url.indexOf('http://') === 0 || url.indexOf('https://') === 0;
    }
  }
}
