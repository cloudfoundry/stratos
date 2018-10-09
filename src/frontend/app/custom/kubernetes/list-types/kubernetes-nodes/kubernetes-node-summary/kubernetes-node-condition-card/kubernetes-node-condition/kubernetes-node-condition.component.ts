import { Component, OnInit, Input } from '@angular/core';
import { ConditionType, Condition } from '../../../../../store/kube.types';
import { KubernetesNodeService } from '../../../../../services/kubernetes-node.service';
import { map, filter } from 'rxjs/operators';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-kubernetes-node-condition',
  templateUrl: './kubernetes-node-condition.component.html',
  styleUrls: ['./kubernetes-node-condition.component.scss']
})
export class KubernetesNodeConditionComponent implements OnInit {


  @Input()
  condition: ConditionType;
  condition$: Observable<Condition>;

  @Input()
  inverse = false;

  public titles = {
    'Ready': 'Ready',
    'OutOfDisk': 'Out of Disk',
    'MemoryPressure': 'Memory Pressure',
    'DiskPressure': 'Disk Pressure'
  };

  public icons = {
    'Ready': ['done_outline', 'material-icons'],
    'OutOfDisk': ['storage', 'material-icons'],
    'MemoryPressure': ['memory', 'material-icons'],
    'DiskPressure': ['storage', 'material-icons'],
  };

  constructor(
    public kubeNodeService: KubernetesNodeService
  ) { }

  ngOnInit() {
    this.condition$ = this.kubeNodeService.node$.pipe(
      filter(p => !!p && !!p.entity),
      map(p => p.entity.status.conditions),
      map(conditions => conditions.filter(o => o.type === this.condition)[0])
    );
  }

  shouldBeGreen(condition: Condition) {
    if (!condition) {
      return false;
    }
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
