import { concat } from 'rxjs/observable/concat';
import { Observable, Subscription } from 'rxjs/Rx';
import { Component, OnInit, Input, OnDestroy, Output, AfterViewInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { MdSnackBar, MdSnackBarRef, SimpleSnackBar } from '@angular/material';
import { UserService } from '../../../core/user.service';
import { EndpointsService } from '../../../core/endpoints.service';

@Component({
  selector: 'app-endpoints-missing',
  templateUrl: './endpoints-missing.component.html',
  styleUrls: ['./endpoints-missing.component.scss']
})
export class EndpointsMissingComponent implements OnInit, AfterViewInit, OnDestroy {

  @Input('showSnackForNoneConnected') showSnackForNoneConnected = false;

  showNoneRegistered = false;
  showNoneConnected = false;
  firstLine;
  secondLine;
  hide = false;

  snackBarText = {
    message: `To access your cloud native workloads and other related third party services, connect with
    your personal credentials to the corresponding registered services.`,
    action: 'Got it'
  };

  noneRegisteredText = {
    firstLineText: 'There are no registered endpoints',
    secondLineText: {
      link: '/endpoints/new',
      linkText: 'Register an endpoint',
      text: ' to make it available to developers.',
    }
  };

  noneConnectedText = {
    firstLineText: 'There are no connected endpoints',
    secondLineText: {
      link: '/endpoints',
      linkText: 'Connect with your personal credentials',
      text: ' to access your cloud native workloads and other related third party services',
    }
  };

  subscription: Subscription;

  private _snackBar: MdSnackBarRef<SimpleSnackBar>;

  constructor(private userService: UserService, private snackBar: MdSnackBar, public endpointService: EndpointsService) { }

  ngOnInit() {

  }

  ngAfterViewInit() {
    this.subscription = Observable.combineLatest(
      this.endpointService.haveRegistered$,
      this.endpointService.haveConnected$
    ).subscribe(([haveRegistered, haveConnected]) => {
      const showNoneRegistered = !haveRegistered;
      const showNoneConnected = !this.showSnackForNoneConnected && haveRegistered && !haveConnected;

      setTimeout(() => {
        this.firstLine = showNoneConnected ? this.noneConnectedText.firstLineText : this.noneRegisteredText.firstLineText;
        this.secondLine = showNoneConnected ? this.noneConnectedText.secondLineText : this.noneRegisteredText.secondLineText;
        this.hide = !showNoneRegistered && !showNoneConnected;
        this.showSnackBar(this.showSnackForNoneConnected && haveRegistered && !haveConnected);
      });
    });
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
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
