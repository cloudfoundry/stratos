import { TimerObservable } from 'rxjs/observable/TimerObservable';
import { environment } from './../../../../../environments/environment';
import { mergeMap, catchError  } from 'rxjs/operators';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Subscription } from 'rxjs';

// Check every 5 seconds
const DETECT_INTERVAL = 5000;

/**
 * When we deploy an app, we don't know the guid for the new app until it is created.
 * We don't know when the app has been created, so we must poll.
 *
 * This helper will poll, looking for the new app.
 */
export class DiscoverAppHelper {

  // Are we polling?
  pollSub: Subscription;

  proxyAPIVersion = environment.proxyAPIVersion;

  app;

  constructor(
    private http: HttpClient,
    private cfGuid: string,
    private spaceGuid: string,
    private name: string
  ) { }

  // Start the poller
  startDetection(app$: BehaviorSubject<boolean>) {
    if (!this.pollSub) {
      this.pollSub = TimerObservable.create(0, DETECT_INTERVAL)
      .subscribe(() => {
        return this.http
          .get(`/pp/${this.proxyAPIVersion}/proxy/v2/apps?q=space_guid:` + this.spaceGuid + '&q=name:' + this.name, this.getRequestArgs())
          .pipe(
            mergeMap(info => {
              if (info && info[this.cfGuid]) {
                const apps = info[this.cfGuid];
                if (apps.total_results === 1) {
                  this.stopDetection();
                  this.app = apps.resources[0];
                  app$.next(true);
                }
              }
              return [];
            }),
            catchError(err => [
              // ignore
            ])
          ).subscribe();
        }
      );
    }
  }

  // Stop looking for an app
  stopDetection() {
    if (this.pollSub) {
      this.pollSub.unsubscribe();
      this.pollSub = undefined;
    }
  }

  // Helper to get the request args with the CNSI
  getRequestArgs() {
    const headers = new HttpHeaders({ 'x-cap-cnsi-list': this.cfGuid });
    const requestArgs = {
      headers: headers
    };
    return requestArgs;
  }

}
