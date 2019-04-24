import { Component } from '@angular/core';

import { CardCell } from '../../../../shared/components/list/list.types';
import { HelmReleaseService } from '../../store/helm.types';

@Component({
  selector: 'app-release-service-card',
  templateUrl: './helm-release-service-card.component.html',
  styleUrls: ['./helm-release-service-card.component.scss']
})
export class HelmReleaseServiceCardComponent extends CardCell<HelmReleaseService> { }
