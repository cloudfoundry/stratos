import { Component, OnInit, Input } from '@angular/core';
import { Observable } from 'rxjs/Observable';

export interface IAppChip<T = string> {
  key: T;
  value: string;
  clearAction?: (chip: IAppChip) => void;
  hideClearButton?: boolean;
  busy?: Observable<boolean>;
  color?: string;
}
export class AppChip<T = string> {
  key?: T;
  value: string;
  clearAction?: (chip: IAppChip<T>) => void;
  hideClearButton?: boolean;
  busy?: Observable<boolean>;
  color?: string;
}

@Component({
  selector: 'app-chips',
  templateUrl: './chips.component.html',
  styleUrls: ['./chips.component.scss']
})
export class AppChipsComponent implements OnInit {

  constructor() { }

  public atLowerLimit = true;

  @Input('chips')
  public chips: AppChip[] = [];

  @Input('stacked')
  stacked = false;

  @Input('orientation')
  orientation: 'rtl' | 'ltr' = 'ltr';

  @Input('lowerLimit')
  lowerLimit = 3;

  @Input('displayProperty')
  displayProperty = 'value';

  public limit;

  ngOnInit() {
    this.limit = this.lowerLimit;
  }

  public toggleLimit() {
    if (this.limit === this.lowerLimit) {
      this.limit = this.chips.length;
      this.atLowerLimit = false;
    } else {
      this.limit = this.lowerLimit;
      this.atLowerLimit = true;
    }
  }

}
