import { AppState } from '../../../store/app-state';
import { Store } from '@ngrx/store';
import { Component, OnInit, AfterContentInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { pipe } from 'rxjs';
import { tap } from 'rxjs/operators';

@Component({
  selector: 'app-home-page',
  templateUrl: './home-page.component.html',
  styleUrls: ['./home-page.component.scss']
})
export class HomePageComponent implements OnInit, AfterContentInit {

  constructor(private store: Store<AppState>, private http: HttpClient) { }

  ngOnInit() {

    const cfGuid = '2543b6ba-4d68-4642-8a25-cd3e0b528b0a';
    const spaceGuid = '4e2d7f7e-5f02-44d5-ba1c-b74f1c0dabbf';

    const headers = new HttpHeaders({ 'x-cap-cnsi-list': cfGuid });
    this.http.get(`/pp/v1/proxy/v2/spaces/${spaceGuid}/domains?inline-relations-depth=1`, { headers: headers }).pipe(
      tap(info => console.log(info))
    ).subscribe();

    this.http.get(`/pp/v1/proxy/v2/shared_domains`, { headers: headers }).pipe(
      tap(info => console.log(info))
    ).subscribe();


  }

  ngAfterContentInit() {
  }

}
