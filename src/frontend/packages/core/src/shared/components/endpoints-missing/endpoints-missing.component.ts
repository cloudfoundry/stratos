import { Component, Input, OnInit, inject, ChangeDetectionStrategy, input } from '@angular/core';
import { combineLatest as observableCombineLatest, Observable } from 'rxjs';
import { delay, map, startWith } from 'rxjs/operators';

import { EndpointsService } from '../../../core/endpoints.service';
import { CommonModule } from '@angular/common';
import { NoContentMessageComponent } from '../no-content-message/no-content-message.component';

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
  host: { class: 'block relative overflow-visible' },
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    NoContentMessageComponent
  ]
})
export class EndpointsMissingComponent implements OnInit {

  @Input() showToolbarHint = true;
  readonly showDirectToEndpointMessage = input(true);

  noContent$!: Observable<EndpointMissingMessageParts | null>;

  protected noneRegisteredText: EndpointMissingMessageParts = {
    firstLine: 'There are no registered endpoints',
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

  protected showNoConnected = false;
  protected haveRegistered$: Observable<boolean>;
  protected haveConnected$: Observable<boolean>;

  public endpointsService = inject(EndpointsService);

  constructor() {
    this.haveRegistered$ = this.endpointsService.haveRegistered$;
    this.haveConnected$ = this.endpointsService.haveConnected$;
  }
  ngOnInit() {
    if (this.showToolbarHint) {
      this.noneRegisteredText.toolbarLink = {
        text: 'Register an endpoint'
      };
    }
    // Assigned before the first render: the template's async pipe reads it
    // once, and nothing re-renders this OnPush view to pick up a later value.
    this.noContent$ = observableCombineLatest([
      this.haveRegistered$,
      this.haveConnected$,
      this.endpointsService.disablePersistenceFeatures$
    ]).pipe(
      delay(1),
      map(([hasRegistered, hasConnected, disablePersistenceFeatures]): EndpointMissingMessageParts | null => {
        if (!hasRegistered) {
          return this.removeAdvice(this.noneRegisteredText, disablePersistenceFeatures);
        }
        if (!hasConnected && this.showNoConnected) {
          return this.removeAdvice(this.noneConnectedText, disablePersistenceFeatures);
        }
        return null;
      }),
      startWith<EndpointMissingMessageParts | null>(null)
    );
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
}
