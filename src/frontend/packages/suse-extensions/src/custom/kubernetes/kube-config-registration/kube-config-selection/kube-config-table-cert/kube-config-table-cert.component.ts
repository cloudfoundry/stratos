import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, Input } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { timeout } from 'rxjs/operators';

import { TableCellCustom } from '../../../../../../../core/src/shared/components/list/list.types';
import { KubeConfigHelper } from '../../kube-config.helper';
import { KubeConfigFileCluster } from '../../kube-config.types';

type CertResponse = {
  Status: number;
  Required: boolean;
  Error: boolean;
  Message: string;
}

@Component({
  selector: 'app-kube-config-table-cert',
  templateUrl: './kube-config-table-cert.component.html',
  styleUrls: ['./kube-config-table-cert.component.scss']
})
export class KubeConfigTableCertComponent extends TableCellCustom<KubeConfigFileCluster> {

  initialValue = new BehaviorSubject<{
    checked: boolean
  }>(null)
  initialValue$ = this.initialValue.asObservable();

  private pRow: KubeConfigFileCluster;
  @Input()
  set row(row: KubeConfigFileCluster) {
    if (!this.pRow) {
      this.pRow = row;
      if (row.cluster['insecure-skip-tls-verify']) {
        // User has manually specified default skip option
        this.initialValue.next({
          checked: true
        });
      } else {
        // Manually check if a cert is required, if so tick by default
        this.http.get(`/pp/v1/kube/cert?url=${row.cluster.server}`).pipe(
          timeout(5000),
        ).subscribe(
          // Success, no cert required
          (res: CertResponse) => this.update(res.Required),
          // Failed, check for specific cert required error
          (e: HttpErrorResponse) => this.update(false)
        )
      }
    }
  }
  get row(): KubeConfigFileCluster {
    return this.pRow;
  }

  constructor(
    private helper: KubeConfigHelper,
    private http: HttpClient
  ) {
    super()
  }

  private update(checked: boolean) {
    this.initialValue.next({ checked });
    this.valueChanged(checked);
  }

  valueChanged(value) {
    this.row.cluster['insecure-skip-tls-verify'] = value;
    this.helper.update(this.row);
  }

}
