import { Component, OnInit } from '@angular/core';
import { TableCellCustom } from '../../../../../../../../src/frontend/app/shared/components/list/list.types';
import { KubernetesApp } from '../../../../../../../../src/frontend/app/custom/kubernetes/store/kube.types';

@Component({
  selector: 'app-app-link',
  templateUrl: './app-link.component.html',
  styleUrls: ['./app-link.component.scss']
})
export class AppLinkComponent<T> extends TableCellCustom<KubernetesApp> implements OnInit {
  routerLink: string;

  constructor() {
    super();
  }

  ngOnInit(): void {
    this.routerLink = `${this.row.name}`;
  }

}
