import { Observable } from 'rxjs';
import { ActionState } from '@stratosui/store';

export interface IBaseListAction<T> {
  icon?: string;
  label: string;
  description?: string;
}

export interface IListAction<T> extends IBaseListAction<T> {
  action: (item: T) => void;
  createVisible?: (row$: Observable<T>) => Observable<boolean>;
  createEnabled?: (row$: Observable<T>) => Observable<boolean>;
}

export interface IOptionalAction<T> extends IBaseListAction<T> {
  visible$?: Observable<boolean>;
  enabled$?: Observable<boolean>;
}

export interface IMultiListAction<T> extends IOptionalAction<T> {
  /**
   * Return true if the selection should be cleared
   */
  action: (items?: T[]) => boolean | Observable<ActionState>;
}

export interface IGlobalListAction<T> extends IOptionalAction<T> {
  action: () => void;
}
