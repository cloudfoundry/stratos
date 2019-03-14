import { HelmRelease } from '../../store/helm.types';
import { Component, OnInit } from '@angular/core';
import { TableCellCustom } from '../../../../shared/components/list/list.types';

@Component({
  selector: 'app-helm-release-link',
  templateUrl: './helm-release-link.component.html',
  styleUrls: ['./helm-release-link.component.scss']
})
export class HelmReleaseLinkComponent<T> extends TableCellCustom<HelmRelease> implements OnInit {
  routerLink: string;

  constructor() {
    super();
  }

  ngOnInit(): void {
    this.routerLink = `${this.row.guid}`;
  }

}
