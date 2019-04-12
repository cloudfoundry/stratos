import { Component, Input, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { StratosStatus } from '../../shared/shared.types';

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

export class StatefulIconComponent implements OnInit {

  @Input()
  set state(state: StratosStatus) {
    console.log(state);
    this.selectedState = this.stateDefinitions[state] || null;
  }

  @ViewChild('spinner')
  public spinnerTemplate: TemplateRef<any>;

  private stateDefinitions: {
    [key: string]: StatefulIconDefinition;
  } = {};

  public selectedState: StatefulIconDefinition;

  ngOnInit() {
    this.stateDefinitions = {
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
      },
      [StratosStatus.BUSY]: {
        template: this.spinnerTemplate
      }
    };
  }
}
