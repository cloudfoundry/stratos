import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

import { LoggerService } from '../../../../../../../core/src/core/logger.service';
import { Chart } from '../models/chart';
import { ChartVersion } from '../models/chart-version';
import { ConfigService } from './config.service';



/* Most of this code should be in an effect and we should store the data in the app store */
@Injectable()
export class ChartsService {
  hostname: string;
  cacheCharts: any;

  constructor(
    private http: HttpClient,
    config: ConfigService,
    private loggerService: LoggerService
  ) {
    this.hostname = `${config.backendHostname}/chartsvc`;
    this.cacheCharts = {};
    this.hostname = '/pp/v1/chartsvc';
  }

  /**
   * Get all charts from the API
   *
   * @return An observable that will an array with all Charts
   */
  getCharts(repo: string = 'all'): Observable<Chart[]> {
    let url: string;
    switch (repo) {
      case 'all': {
        url = `${this.hostname}/v1/charts`;
        break;
      }
      default: {
        url = `${this.hostname}/v1/charts/${repo}`;
      }
    }

    if (this.cacheCharts[repo] && this.cacheCharts[repo].length > 0) {
      return Observable.create((observer) => {
        observer.next(this.cacheCharts[repo]);
      });
    } else {
      return this.http.get<{ data: any }>(url).pipe(
        map(r => this.extractData(r)),
        tap((data) => this.storeCache(data, repo)),
        catchError(this.handleError)
      );
    }
  }

  /**
   * Get a chart using the API
   *
   * @param repo Repository name
   * @param chartName Chart name
   * @return An observable that will a chart instance
   */
  getChart(repo: string, chartName: string): Observable<Chart> {
    // Transform Observable<Chart[]> into Observable<Chart>[]
    return this.http.get(`${this.hostname}/v1/charts/${repo}/${chartName}`).pipe(
      map(this.extractData),
      catchError(this.handleError)
    );
  }

  // TODO: use backend search API endpoint
  searchCharts(query, repo?: string): Observable<Chart[]> {
    const re = new RegExp(query, 'i');
    return this.getCharts(repo).pipe(
      map(charts => {
        return charts.filter(chart => {
          return chart.attributes.name.match(re) ||
            chart.attributes.description.match(re) ||
            chart.attributes.repo.name.match(re) ||
            this.arrayMatch(chart.attributes.keywords, re) ||
            this.arrayMatch((chart.attributes.maintainers || []).map((m) => m.name), re) ||
            this.arrayMatch(chart.attributes.sources, re);
        });
      })
    );
  }

  arrayMatch(keywords: string[], re): boolean {
    if (!keywords) { return false; }

    return keywords.some((keyword) => {
      return !!keyword.match(re);
    });
  }

  /**
   * Get a chart Readme using the API
   *
   * @param repo Repository name
   * @param chartName Chart name
   * @param version Chart version
   * @return An observable that will be a chartReadme
   */
  getChartReadme(chartVersion: ChartVersion): Observable<string> {
    return this.http.get(`${this.hostname}${chartVersion.attributes.readme}`, {
      responseType: 'text'
    });
  }
  /**
   * Get chart versions using the API
   *
   * @param repo Repository name
   * @param chartName Chart name
   * @return An observable containing an array of ChartVersions
   */
  getVersions(repo: string, chartName: string): Observable<ChartVersion[]> {
    return this.http.get<{ data: any }>(`${this.hostname}/v1/charts/${repo}/${chartName}/versions`).pipe(
      map(m => this.extractData(m)),
      catchError(this.handleError)
    );
  }

  /**
   * Get chart version using the API
   *
   * @param repo Repository name
   * @param chartName Chart name
   * @return An observable containing an array of ChartVersions
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
   * @param chart Chart object
   */
  getChartIconURL(chart: Chart): string {
    if (chart.attributes.icon) {
      return `${this.hostname}${chart.attributes.icon}`;
    } else {
      return '/core/assets/custom/placeholder.png';
    }
  }

  /**
   * Store the charts in the cache
   *
   * @param data Elements in the response
   * @return Return the same response
   */
  private storeCache(data: Chart[], repo: string): Chart[] {
    this.cacheCharts[repo] = data;
    return data;
  }


  private extractData(res: { data: any }) {
    return res.data || {};
  }

  private handleError(error: any) {
    const errMsg = (error.message) ? error.message :
      error.status ? `${error.status} - ${error.statusText}` : 'Server error';
    if (!!this.loggerService) {
      this.loggerService.error(errMsg);
    }
    return throwError(errMsg);
  }

}
