import { ChangeDetectionStrategy, Component} from '@angular/core';


import { ListConfig } from '../../../../../core/src/shared/components/list/list.component.types';
import { KubernetesNodesListConfigService } from '../../list-types/kubernetes-nodes/kubernetes-nodes-list-config.service';
import { ListComponent } from '../../../../../core/src/shared/components/list/list.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-kubernetes-nodes-tab',
  templateUrl: './kubernetes-nodes-tab.component.html',
  styleUrls: ['./kubernetes-nodes-tab.component.scss'],
  standalone: true,
  imports: [
    ListComponent
],
  providers: [{
    provide: ListConfig,
    useClass: KubernetesNodesListConfigService,
  }]
})
export class KubernetesNodesTabComponent {

  constructor() { }

}
