import { Component, OnInit, inject, ChangeDetectionStrategy, input, computed, Signal } from '@angular/core';

import { EndpointsService } from '../../../core/endpoints.service';
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
    NoContentMessageComponent
  ]
})
export class EndpointsMissingComponent implements OnInit {

  public endpointsService = inject(EndpointsService);

  readonly showToolbarHint = input(true);
  readonly showDirectToEndpointMessage = input(true);


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
  // Subclasses swap these for their own endpoint type's flags.
  protected haveRegistered: Signal<boolean> = this.endpointsService.haveRegistered;
  protected haveConnected: Signal<boolean> = this.endpointsService.haveConnected;

  readonly noContent = computed((): EndpointMissingMessageParts | null => {
    const disablePersistenceFeatures = this.endpointsService.disablePersistenceFeatures();
    if (!this.haveRegistered()) {
      return this.removeAdvice(this.noneRegisteredText, disablePersistenceFeatures);
    }
    if (!this.haveConnected() && this.showNoConnected) {
      return this.removeAdvice(this.noneConnectedText, disablePersistenceFeatures);
    }
    return null;
  });

  ngOnInit() {
    if (this.showToolbarHint()) {
      this.noneRegisteredText.toolbarLink = {
        text: 'Register an endpoint'
      };
    }
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
