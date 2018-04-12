import { concat } from 'rxjs/observable/concat';
import { Observable, Subscription } from 'rxjs/Rx';
import { Component, OnInit, Input, OnDestroy, Output, AfterViewInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { MatSnackBar, MatSnackBarRef, SimpleSnackBar } from '@angular/material';
import { UserService } from '../../../core/user.service';
import { EndpointsService } from '../../../core/endpoints.service';
import { CloudFoundryService } from '../../data-services/cloud-foundry.service';
import { map, tap, delay } from 'rxjs/operators';

@Component({
  selector: 'app-endpoints-missing',
  templateUrl: './endpoints-missing.component.html',
  styleUrls: ['./endpoints-missing.component.scss']
})
export class EndpointsMissingComponent implements OnInit, AfterViewInit, OnDestroy {

  noContent$: Observable<{ firstLine: string; secondLine: { text: string; }; }>;
  @Input('showSnackForNoneConnected') showSnackForNoneConnected = false;

  @Input('showToolbarHint') showToolbarHint = false;

  snackBarText = {
    message: `There are no connected Cloud Foundry endpoints, connect with your personal credentials to get started.`,
    action: 'Got it'
  };

  noneRegisteredText = {
    firstLine: 'There are no registered Cloud Foundry endpoints',
    toolbarLink: {
      text: 'Register an endpoint'
    },
    secondLine: {
      text: 'Use the Endpoints view to register'
    },
  };

  noneConnectedText = {
    firstLine: 'There are no connected Cloud Foundry endpoints',
    secondLine: {
      text: 'Use the Endpoints view to connect'
    },
  };

  private _snackBar: MatSnackBarRef<SimpleSnackBar>;

  constructor(private userService: UserService, private snackBar: MatSnackBar, public cloudFoundryService: CloudFoundryService) { }

  ngOnInit() {

  }

  ngAfterViewInit() {
    this.noContent$ = Observable.combineLatest(
      this.cloudFoundryService.hasRegisteredCFEndpoints$,
      this.cloudFoundryService.hasConnectedCFEndpoints$
    ).pipe(
      delay(1),
      tap(([hasRegistered, hasConnected]) => {
        this.showSnackBar(this.showSnackForNoneConnected && hasRegistered && !hasConnected);
      }),
      map(([hasRegistered, hasConnected]) => {
        if (!hasRegistered) {
          return this.noneRegisteredText;
        }
        if (!hasConnected) {
          return this.showSnackForNoneConnected ? null : this.noneConnectedText;
        }
        return null;
      })
    ).startWith(null);
  }

  ngOnDestroy() {
    this.showSnackBar(false);
  }

  private showSnackBar(show: boolean) {
    if (!this._snackBar && show) {
      this._snackBar = this.snackBar.open(this.snackBarText.message, this.snackBarText.action, {});
    } else if (this._snackBar && !show) {
      this._snackBar.dismiss();
    }
  }

}
