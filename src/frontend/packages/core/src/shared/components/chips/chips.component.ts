import { Component, Input, OnInit } from '@angular/core';
import { Observable } from 'rxjs';

export interface IAppChip<T = string> {
  key?: T;
  value: string;
  clearAction?: (chip: IAppChip<T>) => void;
  hideClearButton$?: Observable<boolean>;
  busy?: Observable<boolean>;
  color?: string;
}
export class AppChip<T = string> implements IAppChip<T> {
  key?: T;
  value: string;
  clearAction?: (chip: IAppChip<T>) => void;
  hideClearButton$?: Observable<boolean>;
  busy?: Observable<boolean>;
  color?: string;
  url?: {
    link: string,
    params: { [paramName: string]: string }
  };
}

@Component({
  selector: 'app-chips',
  templateUrl: './chips.component.html',
  styleUrls: ['./chips.component.scss']
})
export class AppChipsComponent implements OnInit {

  constructor() { }

  public atLowerLimit = true;

  @Input()
  public chips: AppChip[] = [];

  @Input()
  stacked = false;

  @Input()
  orientation: 'rtl' | 'ltr' = 'ltr';

  @Input()
  lowerLimit = 3;

  @Input()
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
