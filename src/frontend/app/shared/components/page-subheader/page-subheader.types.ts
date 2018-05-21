import { Observable } from 'rxjs/Observable';

export interface ISubHeaderTabs {
  link: string;
  label: string;
  hidden?: Observable<boolean>;
}
