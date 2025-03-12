import { Injectable } from '@angular/core';

import { WindowRef } from '../window-ref/window-ref.service';

import {fromEvent as observableFromEvent } from 'rxjs';
import {map, debounceTime} from 'rxjs/operators';


export class ResizeEventData {
  innerWidth: number;
}

@Injectable()
export class EventWatcherService {
  constructor(private windowRef: WindowRef) { }

  resizeEvent$ = observableFromEvent(this.windowRef.nativeWindow, 'resize').pipe(debounceTime(250), map(() => {
    const { innerWidth } = this.windowRef.nativeWindow;
    return {
      innerWidth
    };
  }), );
}
