import { AfterViewInit, Component } from '@angular/core';
import { MatSnackBar } from '@angular/material';
import { combineLatest as observableCombineLatest, Observable } from 'rxjs';
import { delay, map, startWith, tap } from 'rxjs/operators';

import { UserService } from '../../../core/user.service';
import { CloudFoundryService } from '../../data-services/cloud-foundry.service';


@Component({
  selector: 'app-cf-endpoints-missing',
  templateUrl: './cf-endpoints-missing.component.html',
  styleUrls: ['./cf-endpoints-missing.component.scss']
})
export class CfEndpointsMissingComponent implements AfterViewInit {

  noContent$: Observable<{ firstLine: string; secondLine: { text: string; }; }>;

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

  constructor(private userService: UserService, private snackBar: MatSnackBar, public cloudFoundryService: CloudFoundryService) { }

  ngAfterViewInit() {
    this.noContent$ = observableCombineLatest(
      this.cloudFoundryService.hasRegisteredCFEndpoints$,
      this.cloudFoundryService.hasConnectedCFEndpoints$
    ).pipe(
      delay(1),
      map(([hasRegistered, hasConnected]) => {
        if (!hasRegistered) {
          return this.noneRegisteredText;
        }
        if (!hasConnected) {
          return this.noneConnectedText;
        }
        return null;
      })
    ).pipe(startWith(null));
  }
}
