import { Component, type OnInit, Input, type OnChanges, type SimpleChanges, ChangeDetectionStrategy } from '@angular/core';


@Component({
  selector: 'app-view-buildpack',
  templateUrl: './view-buildpack.component.html',
  styleUrls: ['./view-buildpack.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: []
})
export class ViewBuildpackComponent implements OnInit, OnChanges {

  @Input() buildPack!: string;
  isWebLink!: boolean;

  ngOnInit() {
    // Component initialization - buildpack detection handled in ngOnChanges
  }

  ngOnChanges(values: SimpleChanges) {
    if (values.buildPack.firstChange || values.buildPack.currentValue !== values.buildPack.previousValue) {
      const buildPack = values.buildPack.currentValue;
      let url = typeof buildPack !== 'undefined' && buildPack ? buildPack : '';
      url = url.trim().toLowerCase();
      this.isWebLink = url.indexOf('http://') === 0 || url.indexOf('https://') === 0;
    }
  }
}
