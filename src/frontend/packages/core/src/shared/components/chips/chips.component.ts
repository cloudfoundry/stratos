import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit, inject } from '@angular/core';
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
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppChipsComponent implements OnInit {
  private cdr = inject(ChangeDetectorRef);

  public atLowerLimit = true;

  private pChips: AppChip[] = [];
  @Input()
  get chips(): AppChip[] {
    return this.pChips;
  }
  set chips(chips: AppChip[]) {
    this.pChips = chips;
    this.cdr.markForCheck();
  }

  @Input()
  stacked = false;

  @Input()
  orientation: 'rtl' | 'ltr' = 'ltr';

  @Input()
  lowerLimit = 3;

  private pDisplayProperty = 'value';
  @Input()
  get displayProperty(): string {
    return this.pDisplayProperty;
  }
  set displayProperty(displayProperty: string) {
    this.pDisplayProperty = displayProperty;
    this.cdr.markForCheck();
  }

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
    this.cdr.markForCheck();
  }

  public getChipClasses(color?: string): string {
    if (!color) {
      return 'bg-content-secondary border-content-border text-content-text';
    }
    const colorMap: { [key: string]: string } = {
      'primary': 'bg-blue-100 border-blue-300 text-blue-800',
      'success': 'bg-green-100 border-green-300 text-green-800',
      'warning': 'bg-yellow-100 border-yellow-300 text-yellow-800',
      'danger': 'bg-red-100 border-red-300 text-red-800',
      'info': 'bg-cyan-100 border-cyan-300 text-cyan-800'
    };
    return colorMap[color] || 'bg-content-secondary border-content-border text-content-text';
  }

}
