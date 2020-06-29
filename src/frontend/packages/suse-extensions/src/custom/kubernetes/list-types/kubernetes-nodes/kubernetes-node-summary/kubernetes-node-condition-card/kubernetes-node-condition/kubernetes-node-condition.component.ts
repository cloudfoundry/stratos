import { Component, Input, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';

import { KubernetesNodeService } from '../../../../../services/kubernetes-node.service';
import { ConditionType, ConditionTypeLabels, KubernetesCondition } from '../../../../../store/kube.types';

@Component({
  selector: 'app-kubernetes-node-condition',
  templateUrl: './kubernetes-node-condition.component.html',
  styleUrls: ['./kubernetes-node-condition.component.scss']
})
export class KubernetesNodeConditionComponent implements OnInit {


  @Input()
  condition: ConditionType;
  condition$: Observable<boolean>;

  @Input()
  inverse = false;

  @Input()
  subtle = false;

  public titles = ConditionTypeLabels;

  public icons = {
    Ready: ['done_outline', 'material-icons'],
    OutOfDisk: ['storage', 'material-icons'],
    MemoryPressure: ['memory', 'material-icons'],
    DiskPressure: ['storage', 'material-icons'],
    PIDPressure: ['vertical_align_center', 'material-icons'],
    NetworkUnavailable: ['settings_ethernet', 'material-icons']
  };

  constructor(
    public kubeNodeService: KubernetesNodeService
  ) { }

  ngOnInit() {
    this.condition$ = this.kubeNodeService.node$.pipe(
      filter(p => !!p && !!p.entity),
      map(p => p.entity.status.conditions),
      map(conditions => conditions.filter(o => o.type === this.condition)),
      filter(conditions => !!conditions.length),
      map(conditions => this.shouldBeGreen(conditions[0]))
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
