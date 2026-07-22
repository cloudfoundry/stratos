import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LongRunningOperationsService {

  isLongRunning(request: Partial<{ message: string }>) {
    return (request.message || '').startsWith('Long Running Operation still active');
  }

}
