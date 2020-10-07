import { Component } from '@angular/core';
import { CardCell } from 'frontend/packages/core/src/shared/components/list/list.types';

import { KubeService } from '../../../store/kube.types';

@Component({
  selector: 'app-kube-service-card',
  templateUrl: './kubernetes-service-card.component.html',
  styleUrls: ['./kubernetes-service-card.component.scss']
})
export class KubeServiceCardComponent extends CardCell<KubeService> { }
