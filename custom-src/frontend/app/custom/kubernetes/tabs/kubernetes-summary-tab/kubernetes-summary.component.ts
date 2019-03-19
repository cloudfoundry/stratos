import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Component, OnInit } from '@angular/core';
import { KubernetesEndpointService } from '../../services/kubernetes-endpoint.service';

@Component({
  selector: 'app-kubernetes-summary',
  templateUrl: './kubernetes-summary.component.html',
  styleUrls: ['./kubernetes-summary.component.scss']
})
export class KubernetesSummaryTabComponent implements OnInit {

  source: SafeResourceUrl;

  dashboardLink: string;

  constructor(public kubeEndpointService: KubernetesEndpointService) { }

  ngOnInit() {
    const guid = this.kubeEndpointService.baseKube.guid;
    this.dashboardLink = `/kubernetes/${guid}/dashboard`;
  }

}
