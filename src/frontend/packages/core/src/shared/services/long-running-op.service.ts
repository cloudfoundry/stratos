import { Injectable, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { AppState } from '@stratosui/store';

@Injectable({
  providedIn: 'root'
})
export class LongRunningOperationsService {
  protected store = inject(Store<AppState>);

  isLongRunning(request: Partial<{ message: string }>) {
    return (request.message || '').startsWith('Long Running Operation still active');
  }

}
