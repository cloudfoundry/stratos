import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Component, OnInit } from '@angular/core';
import { KubernetesEndpointService } from '../../services/kubernetes-endpoint.service';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-kubernetes-summary',
  templateUrl: './kubernetes-summary.component.html',
  styleUrls: ['./kubernetes-summary.component.scss']
})
export class KubernetesSummaryTabComponent implements OnInit {

  source: SafeResourceUrl;

  dashboardLink: string;

  constructor(
    public kubeEndpointService: KubernetesEndpointService,
    public httpClient: HttpClient
  ) { }

  ngOnInit() {
    const guid = this.kubeEndpointService.baseKube.guid;
    this.dashboardLink = `/kubernetes/${guid}/dashboard`;
  }

  public getDashboard() {
    const guid = this.kubeEndpointService.baseKube.guid;
    this.httpClient.get(`/pp/v1/kubedash/${guid}/status`).subscribe(a => {
      console.log('Kube dashboard status');
      console.log(a);
    });
  }

}
