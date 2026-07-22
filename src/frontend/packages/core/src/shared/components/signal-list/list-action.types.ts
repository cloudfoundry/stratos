import { Observable } from 'rxjs';
import { ActionState } from '@stratosui/store';

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- intentional public-API generic: T is propagated to extending action interfaces (IListAction/IOptionalAction/etc.) so the whole family shares one row type
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
