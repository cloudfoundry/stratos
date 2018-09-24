import { Component, OnInit } from '@angular/core';
import { TableCellCustom } from '../../../../../shared/components/list/list.types';
import { HelmReleaseService } from '../../../services/helm-release.service';
import { KubernetesPod } from '../../../store/kube.types';

@Component({
  selector: 'app-helm-release-pod-name-link',
  templateUrl: './helm-release-pod-name-link.component.html',
  styleUrls: ['./helm-release-pod-name-link.component.scss']
})
export class HelmReleasePodNameLinkComponent<T> extends TableCellCustom<KubernetesPod> implements OnInit {
  routerLink: string;

  constructor(public helmReleaseService: HelmReleaseService) {
    super();
  }

  ngOnInit() {
    this.routerLink = `${this.row.metadata.name}`;
  }

}
