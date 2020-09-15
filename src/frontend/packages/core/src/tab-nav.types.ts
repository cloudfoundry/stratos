import { Observable } from 'rxjs';

export interface TabNavItem {
  link: string;
  label: string;
  hidden?: Observable<boolean>;
}
