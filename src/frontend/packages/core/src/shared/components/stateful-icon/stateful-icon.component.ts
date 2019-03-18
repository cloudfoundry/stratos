import { Component, Input, OnChanges, OnInit, TemplateRef, ViewChild, SimpleChanges } from '@angular/core';

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

export class StatefulIconComponent implements OnInit, OnChanges {

  @Input()
  state: string;

  @ViewChild('spinner')
  spinnerTemplate: TemplateRef<any>;

  stateDefinitions: {
    [key: string]: StatefulIconDefinition;
  } = {};

  selectedState: StatefulIconDefinition;

  isTemplate(icon: StatefulIconDefinition): icon is IconTemplateDefinition {
    return !!(icon as IconTemplateDefinition).template;
  }

  ngOnInit() {
    this.stateDefinitions = {
      done: {
        icon: 'done',
        color: 'primary'
      },
      error: {
        icon: 'error',
        color: 'warn'
      },
      busy: {
        template: this.spinnerTemplate
      }
    };
    this.onChange(this.state);
  }

  ngOnChanges(changes: SimpleChanges) {
    this.onChange(changes.state.currentValue);
  }

  private onChange(state) {
    this.selectedState = this.stateDefinitions[state] || null;
  }

}
