import { Signal } from '@angular/core';

export interface TabNavItem {
  link: string;
  label: string;
  hidden?: Signal<boolean>;
}
