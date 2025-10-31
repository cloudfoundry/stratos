import {Component, inject} from '@angular/core';

import { ActivatedRoute } from '@angular/router';

import { ListConfig } from '../../../../../core/src/shared/components/list/list.component.types';
import {
  KubernetesNamespacesListConfigService,
} from '../../list-types/kubernetes-namespaces/kubernetes-namespaces-list-config.service';
import { ListComponent } from '../../../../../core/src/shared/components/list/list.component';

@Component({
  selector: 'app-kubernetes-namespaces-tab',
  templateUrl: './kubernetes-namespaces-tab.component.html',
  styleUrls: ['./kubernetes-namespaces-tab.component.scss'],
  standalone: true,
  imports: [
    ListComponent
],
  providers: [{
    provide: ListConfig,
    useClass: KubernetesNamespacesListConfigService,
  }]
})
export class KubernetesNamespacesTabComponent {  private activatedRoute = inject(ActivatedRoute);
}
