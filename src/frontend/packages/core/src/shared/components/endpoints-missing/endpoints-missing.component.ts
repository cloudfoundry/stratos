import { AfterViewInit, Component, Input, OnDestroy, OnInit } from '@angular/core';
import { MatSnackBar, MatSnackBarRef, SimpleSnackBar } from '@angular/material';
import { combineLatest as observableCombineLatest, Observable } from 'rxjs';
import { delay, map, startWith, tap } from 'rxjs/operators';

import { EndpointsService } from '../../../core/endpoints.service';

export interface EndpointMissingMessageParts {
  firstLine: string;
  toolbarLink?: {
    text: string
  };
  secondLine: {
    text: string;
  };
}

@Component({
  selector: 'app-endpoints-missing',
  templateUrl: './endpoints-missing.component.html',
  styleUrls: ['./endpoints-missing.component.scss']
})
export class EndpointsMissingComponent implements AfterViewInit, OnDestroy, OnInit {

  @Input() showToolbarHint = true;

  noContent$: Observable<EndpointMissingMessageParts>;
  snackBarText = {
    message: `There are no connected endpoints, connect with your personal credentials to get started.`,
    action: 'Got it'
  };

  protected noneRegisteredText: EndpointMissingMessageParts = {
    firstLine: 'There are no registered endpoints',
    toolbarLink: null,
    secondLine: {
      text: 'Use the Endpoints view to register'
    },
  };

  protected noneConnectedText: EndpointMissingMessageParts = {
    firstLine: 'There are no connected endpoints',
    secondLine: {
      text: 'Use the Endpoints view to connect'
    },
  };

  private snackBarRef: MatSnackBarRef<SimpleSnackBar>;
  protected showNoConnected = false;
  protected haveRegistered$: Observable<boolean>;
  protected haveConnected$: Observable<boolean>;

  constructor(private snackBar: MatSnackBar, public endpointsService: EndpointsService) {
    this.haveRegistered$ = this.endpointsService.haveRegistered$;
    this.haveConnected$ = this.endpointsService.haveConnected$;
  }
  ngOnInit() {
    if (this.showToolbarHint) {
      this.noneRegisteredText.toolbarLink = {
        text: 'Register an endpoint'
      };
    }
  }
  ngAfterViewInit() {
    this.noContent$ = observableCombineLatest(
      this.haveRegistered$,
      this.haveConnected$,
      this.endpointsService.disablePersistenceFeatures$
    ).pipe(
      delay(1),
      tap(([hasRegistered, hasConnected]) => {
        this.showSnackBar(hasRegistered && !hasConnected);
      }),
      map(([hasRegistered, hasConnected, disablePersistenceFeatures]) => {
        if (!hasRegistered) {
          return this.removeAdvice(this.noneRegisteredText, disablePersistenceFeatures);
        }
        if (!hasConnected && this.showNoConnected) {
          return this.removeAdvice(this.noneConnectedText, disablePersistenceFeatures);
        }
        return null;
      })
    ).pipe(startWith(null));
  }

  private removeAdvice(messageParts: EndpointMissingMessageParts, disablePersistenceFeatures: boolean) {
    if (!disablePersistenceFeatures) {
      return messageParts;
    }

    return {
      ...messageParts,
      secondLine: {
        text: 'Please contact your console administrator'
      }
    };
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
