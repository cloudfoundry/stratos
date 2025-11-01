import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, OnInit  } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Observable } from 'rxjs';

import { ClickStopPropagationDirective } from '../../../core/click-stop-propagation.directive';

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
  value!: string;
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
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ClickStopPropagationDirective
  ],
  templateUrl: './chips.component.html',
  styleUrls: ['./chips.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
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

  public limit!: number;

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

  public getChipClasses(color?: string): string {
    if (!color) {
      return 'bg-gray-100 border-gray-300 text-gray-800';
    }
    const colorMap: { [key: string]: string } = {
      'primary': 'bg-blue-100 border-blue-300 text-blue-800',
      'success': 'bg-green-100 border-green-300 text-green-800',
      'warning': 'bg-yellow-100 border-yellow-300 text-yellow-800',
      'danger': 'bg-red-100 border-red-300 text-red-800',
      'info': 'bg-cyan-100 border-cyan-300 text-cyan-800'
    };
    return colorMap[color] || 'bg-gray-100 border-gray-300 text-gray-800';
  }

}
