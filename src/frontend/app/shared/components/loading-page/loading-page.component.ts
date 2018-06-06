
import {of as observableOf,  Observable ,  combineLatest } from 'rxjs';
import { animate, style, transition, trigger } from '@angular/animations';
import { Component, Input, OnInit } from '@angular/core';
import { RouterState, Router, RouterStateSnapshot, ActivatedRoute } from '@angular/router';
import { filter, first } from 'rxjs/operators';

@Component({
  selector: 'app-loading-page',
  templateUrl: './loading-page.component.html',
  styleUrls: ['./loading-page.component.scss'],
  animations: [
    trigger(
      'leaveLoaderAnimation', [
        transition(':leave', [
          style({ opacity: 1 }),
          animate('250ms ease-out', style({ opacity: 0 }))
        ])
      ]
    )
  ]
})
export class LoadingPageComponent implements OnInit {

  constructor() { }

  @Input('isLoading')
  isLoading: Observable<boolean> = observableOf(false)
    .pipe(
      first()
    );

  @Input('text')
  text = 'Retrieving your data';

  @Input('alert')
  alert = '';

  ngOnInit() {
    if (this.isLoading) {
      this.isLoading
        .pipe(
          filter(loading => !loading),
          first()
        );
    }
  }
}
