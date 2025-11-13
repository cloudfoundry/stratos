import { AsyncPipe, NgStyle } from '@angular/common';
import {Component, Input, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';

import { BooleanIndicatorComponent } from '@stratosui/core';
import { KubernetesNodeService } from '../../../../../services/kubernetes-node.service';
import { ConditionType, ConditionTypeLabels, KubernetesCondition } from '../../../../../store/kube.types';

@Component({
  selector: 'app-kubernetes-node-condition',
  templateUrl: './kubernetes-node-condition.component.html',
  styleUrls: ['./kubernetes-node-condition.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [AsyncPipe, NgStyle, BooleanIndicatorComponent]
})
export class KubernetesNodeConditionComponent implements OnInit {


  @Input()
  condition: ConditionType;
  condition$: Observable<boolean>;
  hasCondition$: Observable<boolean>;

  @Input()
  overrideCondition$: Observable<boolean>;

  @Input()
  type = 'yes-no';

  @Input()
  inverse = false;

  @Input()
  subtle = false;

  @Input()
  paddingTop = '20px';

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

  ngOnInit() {
    this.condition$ = this.overrideCondition$ ? this.overrideCondition$ : this.kubeNodeService.node$.pipe(
      filter(p => !!p && !!p.entity),
      map(p => p.entity.status.conditions),
      map(conditions => conditions.filter(o => o.type === this.condition)),
      filter(conditions => !!conditions.length),
      map(conditions => this.shouldBeGreen(conditions[0]))
    );
    this.hasCondition$ = this.condition$.pipe(
      map(() => true)
    );
  }

  shouldBeGreen(condition: KubernetesCondition) {
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
