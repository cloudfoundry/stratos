import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';

import { WindowRef } from '../window-ref/window-ref.service';

export class ResizeEventData {
  innerWidth: number;
}

@Injectable()
export class EventWatcherService {
  constructor(private windowRef: WindowRef) { }

  resizeEvent$ = Observable.fromEvent(this.windowRef.nativeWindow, 'resize').debounceTime(250).map(() => {
    const { innerWidth } = this.windowRef.nativeWindow;
    return {
      innerWidth
    };
  });
}
