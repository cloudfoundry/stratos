import { Observable } from 'rxjs';


export interface MenuItem {
  icon?: string;
  label: string;
  action: () => void;
  can?: Observable<boolean>;
  disabled?: Observable<boolean>;
  separator?: boolean;
}
