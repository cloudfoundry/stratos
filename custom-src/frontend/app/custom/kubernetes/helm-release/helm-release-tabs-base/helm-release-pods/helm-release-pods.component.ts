import { Component, OnInit } from '@angular/core';
import { ListConfig } from '../../../../../shared/components/list/list.component.types';
import { HelmReleasePodsListConfigService } from '../../../list-types/helm-release-pods/helm-release-pods-list-config.service';
@Component({
  selector: 'app-helm-release-pods',
  templateUrl: './helm-release-pods.component.html',
  styleUrls: ['./helm-release-pods.component.scss'],
  providers: [{
    provide: ListConfig,
    useClass: HelmReleasePodsListConfigService,
  }]
})
export class HelmReleasePodsComponent implements OnInit {

  constructor() { }

  ngOnInit() {
  }

}
