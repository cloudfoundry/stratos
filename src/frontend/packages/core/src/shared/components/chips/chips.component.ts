import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Observable } from 'rxjs';

import { ClickStopPropagationDirective } from '../../../core/click-stop-propagation.directive';
import { AppBusyComponent } from '../busy-indicator/busy-indicator.component';

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
    AppBusyComponent,
    CommonModule,
    RouterModule,
    ClickStopPropagationDirective
  ],
  templateUrl: './chips.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppChipsComponent {
  readonly chips = input<AppChip[]>([]);

  readonly stacked = input(false);

  readonly orientation = input<'rtl' | 'ltr'>('ltr');

  readonly lowerLimit = input(3);

  readonly displayProperty = input('value');

  private readonly expanded = signal(false);

  readonly atLowerLimit = computed(() => !this.expanded());

  readonly limit = computed(() => this.expanded() ? this.chips().length : this.lowerLimit());

  public toggleLimit() {
    this.expanded.update(expanded => !expanded);
  }

  // displayProperty allows callers to render arbitrary chip-shaped objects,
  // so the lookup has to go through a dynamic string key
  public getDisplayValue(chip: AppChip): string {
    const value: unknown = Reflect.get(chip, this.displayProperty());
    return value == null ? '' : String(value);
  }

  public getChipClasses(color?: string): string {
    if (!color) {
      return 'bg-content-secondary border-content-border text-content-text';
    }
    const colorMap: { [key: string]: string } = {
      'primary': 'bg-info-50 border-info-300 text-info-900 dark:bg-info-900/40 dark:border-info-700 dark:text-info-100',
      'success': 'bg-success-50 border-success-300 text-success-900 dark:bg-success-900/40 dark:border-success-700 dark:text-success-100',
      'warning': 'bg-warning-50 border-warning-300 text-warning-900 dark:bg-warning-900/40 dark:border-warning-700 dark:text-warning-100',
      'danger': 'bg-danger-50 border-danger-300 text-danger-900 dark:bg-danger-900/40 dark:border-danger-700 dark:text-danger-100',
      'info': 'bg-info-50 border-info-300 text-info-900 dark:bg-info-900/40 dark:border-info-700 dark:text-info-100'
    };
    return colorMap[color] || 'bg-content-secondary border-content-border text-content-text';
  }

}
