import { AfterViewInit, Component, Input, OnDestroy, OnInit } from '@angular/core';
import { MatSnackBar, MatSnackBarRef, SimpleSnackBar } from '@angular/material';
import { combineLatest as observableCombineLatest, Observable } from 'rxjs';
import { delay, map, startWith, tap } from 'rxjs/operators';

import { EndpointsService } from '../../../core/endpoints.service';

@Component({
  selector: 'app-endpoints-missing',
  templateUrl: './endpoints-missing.component.html',
  styleUrls: ['./endpoints-missing.component.scss']
})
export class EndpointsMissingComponent implements AfterViewInit, OnDestroy, OnInit {

  @Input() showToolbarHint = true;

  noContent$: Observable<{ firstLine: string; secondLine: { text: string; }; }>;
  snackBarText = {
    message: `There are no connected endpoints, connect with your personal credentials to get started.`,
    action: 'Got it'
  };

  noneRegisteredText = {
    firstLine: 'There are no registered endpoints',
    toolbarLink: null,
    secondLine: {
      text: 'Use the Endpoints view to register'
    },
  };

  noneConnectedText = {
    firstLine: 'There are no connected endpoints',
    secondLine: {
      text: 'Use the Endpoints view to connect'
    },
  };

  private snackBarRef: MatSnackBarRef<SimpleSnackBar>;

  constructor(private snackBar: MatSnackBar, public endpointsService: EndpointsService) { }
  ngOnInit() {
    if (this.showToolbarHint) {
      this.noneRegisteredText.toolbarLink = {
        text: 'Register an endpoint'
      };
    }
  }
  ngAfterViewInit() {
    this.noContent$ = observableCombineLatest(
      this.endpointsService.haveRegistered$,
      this.endpointsService.haveConnected$
    ).pipe(
      delay(1),
      tap(([hasRegistered, hasConnected]) => {
        this.showSnackBar(hasRegistered && !hasConnected);
      }),
      map(([hasRegistered, hasConnected]) => {
        if (!hasRegistered) {
          return this.noneRegisteredText;
        }
        return null;
      })
    ).pipe(startWith(null));
  }

  ngOnDestroy() {
    this.showSnackBar(false);
  }

  private showSnackBar(show: boolean) {
    if (!this.snackBarRef && show) {
      this.snackBarRef = this.snackBar.open(this.snackBarText.message, this.snackBarText.action, {});
    } else if (this.snackBarRef && !show) {
      this.snackBarRef.dismiss();
    }
  }

}
