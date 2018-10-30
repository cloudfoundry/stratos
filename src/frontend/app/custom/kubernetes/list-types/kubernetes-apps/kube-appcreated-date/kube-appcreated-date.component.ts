import { Component, OnInit } from '@angular/core';
import { KubernetesApp } from '../../../store/kube.types';
import { TableCellCustom } from '../../../../../shared/components/list/list.types';

@Component({
  selector: 'app-kube-appcreated-date',
  templateUrl: './kube-appcreated-date.component.html',
  styleUrls: ['./kube-appcreated-date.component.scss']
})
export class KubeAppcreatedDateComponent extends TableCellCustom<KubernetesApp> {

  constructor() {
    super();
   }
}
