import { Injectable, inject } from '@angular/core';

import { WindowRef } from '../window-ref/window-ref.service';

import {fromEvent as observableFromEvent } from 'rxjs';
import {map, debounceTime} from 'rxjs/operators';


export class ResizeEventData {
  innerWidth: number = 0;
}

@Injectable({
  providedIn: 'root'
})
export class EventWatcherService {
  private windowRef = inject(WindowRef);

  resizeEvent$ = observableFromEvent(this.windowRef.nativeWindow, 'resize').pipe(debounceTime(250), map(() => {
    const { innerWidth } = this.windowRef.nativeWindow;
    return {
      innerWidth
    };
  }), );
}
