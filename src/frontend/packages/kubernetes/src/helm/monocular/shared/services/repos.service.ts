import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { RepoAttributes } from '../models/repo';
import { ConfigService } from './config.service';


@Injectable({
  providedIn: 'root'
})
export class ReposService {

  hostname: string;

  constructor(
    private http: HttpClient,
    private config: ConfigService,
  ) {
    this.hostname = `/pp/v1/chartrepos`;
  }

  /**
   * Get all repos from the API
   *
   * @return An observable that will an array with all repos
   */
  getRepos(): Observable<RepoAttributes[]> {
    return this.http.get<{ data: RepoAttributes[] }>(`${this.hostname}`).pipe(
      map(r => this.extractData(r)),
      catchError(this.handleError)
    );
  }

  private extractData<T>(res: { data: T, }): T {
    return res.data || {} as T;
  }

  private handleError(error: { json: () => { message?: string }; status?: number; statusText?: string }): Observable<never> {
    const errMsg = (error.json().message) ? error.json().message :
      error.status ? `${error.status} - ${error.statusText}` : 'Server error';
    console.error(errMsg);
    return throwError(errMsg);
  }
}
