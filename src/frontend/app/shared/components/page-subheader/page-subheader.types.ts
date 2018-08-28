import { Observable } from 'rxjs';

export interface ISubHeaderTabs {
  link: string;
  label: string;
  hidden?: Observable<boolean>;
}
