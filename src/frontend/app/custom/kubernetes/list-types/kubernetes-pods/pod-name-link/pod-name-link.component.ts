import { Component, OnInit } from '@angular/core';
import { KubernetesPod } from '../../../store/kube.types';
import { TableCellCustom } from '../../../../../shared/components/list/list.types';

@Component({
  selector: 'app-pod-name-link',
  templateUrl: './pod-name-link.component.html',
  styleUrls: ['./pod-name-link.component.scss']
})
export class PodNameLinkComponent extends TableCellCustom<KubernetesPod> implements OnInit {
  routerLink: string;

  constructor() {
    super();
  }

  ngOnInit() {
    this.routerLink = `${this.row.metadata.name}`;
  }

}
