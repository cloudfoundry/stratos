import { Injectable } from '@angular/core';
import { Chart } from '../models/chart';
import { ChartVersion } from '../models/chart-version';
import { ConfigService } from './config.service';

import { Observable } from 'rxjs';
import { catchError, filter, first, map, publishReplay, refCount, switchMap, tap, withLatestFrom } from 'rxjs/operators';

import { Http, Response } from '@angular/http';

/* TODO, This is a mocked class. */
@Injectable()
export class ChartsService {
  hostname: string;
  cacheCharts: any;

  constructor(
    private http: Http,
    private config: ConfigService
  ) {
    this.hostname = `${config.backendHostname}/chartsvc`;
    this.cacheCharts = {};
    this.hostname = '/pp/v1/chartsvc';
  }

  /**
   * Get all charts from the API
   *
   * @return {Observable} An observable that will an array with all Charts
   */
  getCharts(repo: string = "all"): Observable<Chart[]> {
    let url: string
    switch(repo) {
      case 'all' : {
        url = `${this.hostname}/v1/charts`
        break
      }
      default: {
        url = `${this.hostname}/v1/charts/${repo}`
      }
    }

    if (this.cacheCharts[repo] && this.cacheCharts[repo].length > 0) {
      return Observable.create((observer) => {
        observer.next(this.cacheCharts[repo]);
      });
    } else {
      return this.http.get(url).pipe(
        map(r => this.extractData(r)),
        tap((data) => this.storeCache(data, repo)),
        catchError(this.handleError)
      );
    }
  }

  /**
   * Get a chart using the API
   *
   * @param {string} repo Repository name
   * @param {string} chartName Chart name
   * @return {Observable} An observable that will a chart instance
   */
  getChart(repo: string, chartName: string): Observable<Chart> {
    // Transform Observable<Chart[]> into Observable<Chart>[]
    return this.http.get(`${this.hostname}/v1/charts/${repo}/${chartName}`).pipe(
      map(this.extractData),
      catchError(this.handleError)
    );
  }

  /* TODO, use backend search API endpoint */
  searchCharts(query, repo?: string): Observable<Chart[]> {
    let re = new RegExp(query, 'i');
    return this.getCharts(repo).pipe(
      map(charts => {
      return charts.filter(chart => {
        return chart.attributes.name.match(re) ||
         chart.attributes.description.match(re) ||
         chart.attributes.repo.name.match(re) ||
         this.arrayMatch(chart.attributes.keywords, re) ||
         this.arrayMatch((chart.attributes.maintainers || []).map((m)=> { return m.name }), re) ||
         this.arrayMatch(chart.attributes.sources, re)
      })
    })
    );
  }

  arrayMatch(keywords: string[], re): boolean {
    if(!keywords) return false

    return keywords.some((keyword) => {
      return !!keyword.match(re)
    })
  }

  /**
   * Get a chart Readme using the API
   *
   * @param {string} repo Repository name
   * @param {string} chartName Chart name
   * @param {string} version Chart version
   * @return {Observable} An observable that will be a chartReadme
   */
  getChartReadme(chartVersion: ChartVersion): Observable<Response> {
    return this.http.get(`${this.hostname}${chartVersion.attributes.readme}`)
  }
  /**
   * Get chart versions using the API
   *
   * @param {string} repo Repository name
   * @param {string} chartName Chart name
   * @return {Observable} An observable containing an array of ChartVersions
   */
  getVersions(repo: string, chartName: string): Observable<ChartVersion[]> {
    return this.http.get(`${this.hostname}/v1/charts/${repo}/${chartName}/versions`).pipe(
      map(m => this.extractData(m)),
      catchError(this.handleError)
    );
  }

  /**
   * Get chart version using the API
   *
   * @param {string} repo Repository name
   * @param {string} chartName Chart name
   * @return {Observable} An observable containing an array of ChartVersions
   */
  getVersion(repo: string, chartName: string, version: string): Observable<ChartVersion> {
    return this.http.get(`${this.hostname}/v1/charts/${repo}/${chartName}/versions/${version}`).pipe(
      map(this.extractData),
      catchError(this.handleError)
    );
  }

  /**
   * Get the URL for retrieving the chart's icon
   * 
   * @param {Chart} chart Chart object
   */
  getChartIconURL(chart: Chart): string {
    if (chart.attributes.icon) {
      return `${this.hostname}${chart.attributes.icon}`
    } else {
      return '/core/assets/custom/placeholder.png';
    }
  }

  /**
   * Store the charts in the cache
   *
   * @param {Chart[]} data Elements in the response
   * @return {Chart[]} Return the same response
   */
  private storeCache(data: Chart[], repo: string): Chart[] {
    this.cacheCharts[repo] = data;
    return data;
  }


  private extractData(res: Response) {
    let body = res.json();
    return body.data || { };
  }

  private handleError (error: any) {
    let errMsg = (error.message) ? error.message :
      error.status ? `${error.status} - ${error.statusText}` : 'Server error';
    console.error(errMsg); // log to console instead
    return Observable.throw(errMsg);
  }

}
