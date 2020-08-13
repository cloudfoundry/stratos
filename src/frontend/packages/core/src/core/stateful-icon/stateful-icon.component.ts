import { Component, Input, TemplateRef } from '@angular/core';

import { StratosStatus } from '../../../../store/src/types/shared.types';

interface IconDefinition {
  icon: string;
  color: 'primary' | 'secondary' | 'warn';
}

interface IconTemplateDefinition {
  template: TemplateRef<any>;
}

type StatefulIconDefinition = IconDefinition | IconTemplateDefinition;

@Component({
  selector: 'app-stateful-icon',
  templateUrl: './stateful-icon.component.html',
  styleUrls: ['./stateful-icon.component.scss']
})

export class StatefulIconComponent {

  @Input()
  set state(state: StratosStatus) {
    this.stateKey = state;
    this.selectedState = this.stateDefinitions[state] || null;
  }
  public allStateKeys = StratosStatus;
  public stateKey: StratosStatus;
  @Input()
  public inline = false;

  private stateDefinitions: {
    [key: string]: StatefulIconDefinition;
  } = {
      [StratosStatus.OK]: {
        icon: 'done',
        color: 'primary'
      },
      [StratosStatus.ERROR]: {
        icon: 'error',
        color: 'warn'
      },
      [StratosStatus.WARNING]: {
        icon: 'warning',
        color: 'warn'
      }
    };

  public selectedState: StatefulIconDefinition;
}
