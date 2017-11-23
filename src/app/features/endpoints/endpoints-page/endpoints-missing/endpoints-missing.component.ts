import { Observable, Subscription } from 'rxjs/Rx';
import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { AppState } from '../../../../store/app-state';
import { AuthState } from '../../../../store/reducers/auth.reducer';
import { CNSISState } from '../../../../store/types/cnsis.types';
import { MdSnackBar, MdSnackBarRef, SimpleSnackBar } from '@angular/material';
import { EndpointsService } from '../../../../core/endpoints.service';
import { UserService } from '../../../../core/user.service';

@Component({
  selector: 'app-endpoints-missing',
  templateUrl: './endpoints-missing.component.html',
  styleUrls: ['./endpoints-missing.component.scss']
})
export class EndpointsMissingComponent implements OnInit, OnDestroy {

  showMissing: boolean;
  subscription: Subscription;

  private _snackBar: MdSnackBarRef<SimpleSnackBar>;

  constructor(private userService: UserService, private snackBar: MdSnackBar, public endpointService: EndpointsService) { }

  ngOnInit() {
    this.subscription = Observable.combineLatest(
      this.endpointService.haveRegistered$,
      this.endpointService.haveConnected$
    ).subscribe(([haveRegistered, haveConnected]) => {
      this.showMissing = !haveRegistered;
      const showSnack = haveRegistered && !haveConnected;
      if (!this._snackBar && showSnack) {
        this._snackBar = this.snackBar.open(`To access your cloud native workloads and other related third party services, connect with
        your personal credentials to the corresponding registered services.`, 'Got it', {});
      } else if (this._snackBar && !showSnack) {
        this._snackBar.dismiss();
      }
    });
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
    if (this._snackBar) {
      this._snackBar.dismiss();
    }
  }

}
