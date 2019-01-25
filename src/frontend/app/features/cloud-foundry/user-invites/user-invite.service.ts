import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { map, catchError } from 'rxjs/operators';
import { MatSnackBar } from '@angular/material';
import { Observable, of } from 'rxjs';
import { Store } from '@ngrx/store';
import { AppState } from '../../../store/app-state';
import { GetSystemInfo } from '../../../store/actions/system.actions';
import { GetAllEndpoints } from '../../../store/actions/endpoint.actions';

const { proxyAPIVersion } = environment;

export interface UserInviteResponse {
  error: boolean;
  errorMessage?: string;
}

@Injectable()
export class UserInviteService {

  constructor(public store: Store<AppState>, public http: HttpClient, public snackBar: MatSnackBar) {}

  configure(cfGUID: string, clientID: string, clientSecret: string): Observable<UserInviteResponse> {
    const formData: FormData = new FormData();
    formData.append('client_id', clientID);
    formData.append('client_secret', clientSecret);
    const url = `/pp/${proxyAPIVersion}/invite/${cfGUID}`;
    const obs$ = this.http.post(url, formData).pipe(
      map(v => {
        this.store.dispatch(new GetSystemInfo());
        return {
          error: false
        };
      }),
      catchError(err => {
        let message = 'Failed to configure User Invitation';
        if (err && err.error && err.error.error) {
          message = err.error.error;
        }
        return of({
          error: true,
          errorMessage: message
        });
      })
    );
    // obs$.subscribe(
    //   data => console.log(data),
    //   err => {
    //     console.log(err);
    //     // Snackbar
    //     let message = 'Failed to configure User Invitation';
    //     if (err && err.error && err.error.error) {
    //       message = err.error.error;
    //     }
    //     this.snackBar.open(message);
    //   }
    // );
    return obs$;
  }

  unconfigure(cfGUID: string): Observable<UserInviteResponse> {
    const url = `/pp/${proxyAPIVersion}/invite/${cfGUID}`;
    return this.http.delete(url).pipe(
      map(v => {
        this.store.dispatch(new GetSystemInfo());
        return {
          error: false
        };
      }),
      catchError(err => {
        let message = 'Failed to configure User Invitation';
        if (err && err.error && err.error.error) {
          message = err.error.error;
        }
        return of({
          error: true,
          errorMessage: message
        });
      })
    );

  }
}
