import { Component } from '@angular/core';
import { CardCell } from 'frontend/packages/core/src/shared/components/list/list.types';
import { MetaCardComponent } from 'frontend/packages/core/src/shared/components/list/list-cards/meta-card/meta-card-base/meta-card.component';
import { MetaCardItemComponent } from 'frontend/packages/core/src/shared/components/list/list-cards/meta-card/meta-card-item/meta-card-item.component';
import { MetaCardKeyComponent } from 'frontend/packages/core/src/shared/components/list/list-cards/meta-card/meta-card-key/meta-card-key.component';
import { MetaCardTitleComponent } from 'frontend/packages/core/src/shared/components/list/list-cards/meta-card/meta-card-title/meta-card-title.component';
import { MetaCardValueComponent } from 'frontend/packages/core/src/shared/components/list/list-cards/meta-card/meta-card-value/meta-card-value.component';
import { MultilineTitleComponent } from 'frontend/packages/core/src/shared/components/multiline-title/multiline-title.component';

import { KubeService } from '../../../store/kube.types';
import { KubernetesServicePortsComponent } from '../../kubernetes-service-ports/kubernetes-service-ports.component';

@Component({
  selector: 'app-kube-service-card',
  templateUrl: './kubernetes-service-card.component.html',
  styleUrls: ['./kubernetes-service-card.component.scss'],
  standalone: true,
  imports: [
    MetaCardComponent,
    MetaCardItemComponent,
    MetaCardKeyComponent,
    MetaCardTitleComponent,
    MetaCardValueComponent,
    MultilineTitleComponent,
    KubernetesServicePortsComponent
  ]
})
export class KubeServiceCardComponent extends CardCell<KubeService> { }
