import { Injectable } from '@angular/core';
import { RepoAttributes } from '../models/repo';
import { ConfigService } from './config.service';

import { Observable } from 'rxjs';


import { catchError, filter, first, map, publishReplay, refCount, switchMap, tap, withLatestFrom } from 'rxjs/operators';


import { Http, Response } from '@angular/http';

@Injectable()
export class ReposService {

  hostname: string;

  constructor(
    private http: Http,
    private config: ConfigService
  ) {
    this.hostname = `/pp/v1/chartrepos`;
  }

  /**
   * Get all repos from the API
   *
   * @return {Observable} An observable that will an array with all repos
   */
  getRepos(): Observable<RepoAttributes[]> {
    return this.http.get(`${this.hostname}`).pipe(
                  map(this.extractData),
                  catchError(this.handleError)
    );
  }

  private extractData(res: Response) {
    let body = res.json();
    return body.data || { };
  }

  private handleError (error: any) {
    let errMsg = (error.json().message) ? error.json().message :
      error.status ? `${error.status} - ${error.statusText}` : 'Server error';
    console.error(errMsg); // log to console instead
    return Observable.throw(errMsg);
  }
}
