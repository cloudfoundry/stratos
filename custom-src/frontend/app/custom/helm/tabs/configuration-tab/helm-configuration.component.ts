import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-helm-configuration',
  templateUrl: './helm-configuration.component.html',
  styleUrls: ['./helm-configuration.component.scss']
})
export class HelmConfigurationComponent implements OnInit {

  constructor(private httpClient: HttpClient) { }

  ngOnInit() {
  }

  public getVersions() {

    console.log('Fetching Helm versions for all Kube endpoints');

    this.httpClient.get('/pp/v1/helm/versions').subscribe(a => {
      console.log('Helm Versions response');
      console.log(a);
    });


  }

}
