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
export class AppChipsComponent {

  constructor() { }

  public atLowerLimit = true;
  private lowerLimit = 3;
  public limit = this.lowerLimit;

  @Input('chips')
  public chips: AppChip[] = [];

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
