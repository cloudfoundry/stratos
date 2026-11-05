import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, TemplateRef, computed, input } from '@angular/core';

import { StratosStatus } from '@stratosui/store';
import { CustomIconComponent } from '../../shared/components/custom-material/custom-material.component';
import { AppBusyComponent } from '../../shared/components/busy-indicator/busy-indicator.component';

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
  standalone: true,
  imports: [
    CommonModule,
    CustomIconComponent,
    AppBusyComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class StatefulIconComponent {
  readonly state = input<StratosStatus>();
  public allStateKeys = StratosStatus;
  public readonly inline = input(false);

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

  readonly selectedState = computed<StatefulIconDefinition | null>(() => {
    const state = this.state();
    return state === undefined ? null : this.stateDefinitions[state] ?? null;
  });

  // Narrows the icon/template union for the template
  get selectedStateIcon(): string {
    const selected = this.selectedState();
    return selected && 'icon' in selected ? selected.icon : '';
  }
}
