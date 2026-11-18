import { ChangeDetectionStrategy, Component, OnInit, AfterContentInit, ViewEncapsulation, HostBinding, input } from '@angular/core';

@Component({
  selector: 'app-tile',
  templateUrl: './tile.component.html',
  styleUrls: ['./tile.component.scss'],
  encapsulation: ViewEncapsulation.None,
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TileComponent implements OnInit, AfterContentInit {

  readonly size = input<string>();

  @HostBinding('class.app-tile-1-3') public isOneThirdFixed = false;

  constructor() { }

  ngOnInit() {
  }

  ngAfterContentInit() {
    const size = this.size();
    if (size) {

      if (size === '1of3') {
        this.isOneThirdFixed = true;
      }
    }
  }
}
