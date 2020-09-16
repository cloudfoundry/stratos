import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { AppState } from '@stratosui/store';

@Injectable()
export class LongRunningOperationsService {

  constructor(protected store: Store<AppState>) { }

  isLongRunning(request: Partial<{ message: string }>) {
    return (request.message || '').startsWith('Long Running Operation still active');
  }

}
