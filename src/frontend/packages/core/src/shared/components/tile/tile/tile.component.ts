import { ChangeDetectionStrategy, Component, type OnInit, type AfterContentInit, Input, ViewEncapsulation, } from '@angular/core';

@Component({
  selector: 'app-tile',
  templateUrl: './tile.component.html',
  styleUrls: ['./tile.component.scss'],
  encapsulation: ViewEncapsulation.None,
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TileComponent implements OnInit, AfterContentInit {

  @Input() size?: string;

  isOneThirdFixed = false;

  ngOnInit() {
    // Component initialization
  }

  ngAfterContentInit() {
    if (this.size) {

      if (this.size === '1of3') {
        this.isOneThirdFixed = true;
      }
    }
  }
}
