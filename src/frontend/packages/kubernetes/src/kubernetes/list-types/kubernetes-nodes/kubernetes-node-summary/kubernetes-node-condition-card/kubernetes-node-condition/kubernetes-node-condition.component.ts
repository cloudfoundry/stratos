import { NgStyle } from '@angular/common';
import { Component, computed, inject, ChangeDetectionStrategy, input } from '@angular/core';

import { BooleanIndicatorComponent, BooleanIndicatorTypeValue } from '@stratosui/core';
import { KubernetesNodeService } from '../../../../../services/kubernetes-node.service';
import { ConditionType, ConditionTypeLabels, KubernetesCondition } from '../../../../../store/kube.types';

@Component({
  selector: 'app-kubernetes-node-condition',
  templateUrl: './kubernetes-node-condition.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [NgStyle, BooleanIndicatorComponent]
})
export class KubernetesNodeConditionComponent {


  // Every host binds it, as a literal string (condition="Ready").
  readonly condition = input.required<ConditionType | `${ConditionType}`>();

  // Set by the host for a row that is not one of the node's conditions
  // (the CaaSP rows); it replaces the node's own value.
  readonly overrideCondition = input<boolean>();

  readonly type = input<BooleanIndicatorTypeValue>('yes-no');

  readonly inverse = input(false);

  readonly subtle = input(false);

  readonly paddingTop = input('20px');

  public titles = ConditionTypeLabels;

  public icons = {
    Ready: ['done_outline', 'material-icons'],
    OutOfDisk: ['storage', 'material-icons'],
    MemoryPressure: ['memory', 'material-icons'],
    DiskPressure: ['storage', 'material-icons'],
    PIDPressure: ['vertical_align_center', 'material-icons'],
    NetworkUnavailable: ['settings_ethernet', 'material-icons'],
    CaaspUpdates: ['vertical_align_top', 'material-icons'],
    CaaspDisruptive: ['warning', 'material-icons'],
    CaaspSecurity: ['security', 'material-icons']
  };
  public kubeNodeService = inject(KubernetesNodeService);

  // The node's condition of this type; null when the node has none.
  private readonly nodeCondition = computed(() => {
    const conditions = (this.kubeNodeService.node()?.status?.conditions ?? [])
      .filter(o => o.type === this.condition());
    return conditions.length ? { value: this.shouldBeGreen(conditions[0]) } : null;
  });
  readonly hasCondition = computed(() => this.overrideCondition() !== undefined || !!this.nodeCondition());
  // boolean | undefined: an "Unknown" condition status renders as the indicator's unknown state
  readonly conditionValue = computed(() => {
    const override = this.overrideCondition();
    return override !== undefined ? override : this.nodeCondition()?.value;
  });

  shouldBeGreen(condition: KubernetesCondition): boolean | undefined {
    if (condition.status === 'True') {
      if (condition.type === ConditionType.Ready) {
        return true;
      }
      return false;
    } else if (condition.status === 'False') {
      if (condition.type === ConditionType.Ready) {
        return false;
      }
      return true;
    }
  }
}
