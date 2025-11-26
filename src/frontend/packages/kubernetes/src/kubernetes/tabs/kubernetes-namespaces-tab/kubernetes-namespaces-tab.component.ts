import {Component, ChangeDetectionStrategy } from '@angular/core';

import { ListComponent, ListConfig } from '@stratosui/core';
import {
  KubernetesNamespacesListConfigService,
} from '../../list-types/kubernetes-namespaces/kubernetes-namespaces-list-config.service';

@Component({
  selector: 'app-kubernetes-namespaces-tab',
  templateUrl: './kubernetes-namespaces-tab.component.html',
  styleUrls: ['./kubernetes-namespaces-tab.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    ListComponent
],
  providers: [{
    provide: ListConfig,
    useClass: KubernetesNamespacesListConfigService,
  }]
})
export class KubernetesNamespacesTabComponent {  
}
