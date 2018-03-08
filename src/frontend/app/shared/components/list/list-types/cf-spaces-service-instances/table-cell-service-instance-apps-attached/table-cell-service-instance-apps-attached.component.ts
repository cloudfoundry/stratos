import { Component, OnInit, Input } from '@angular/core';
import { TableCellCustom } from '../../../list-table/table-cell/table-cell-custom';
import { StringLiteral } from 'typescript';
import { selectEntity } from '../../../../../../store/selectors/api.selectors';
import { ActivatedRoute } from '@angular/router';

interface BoundApp {
  appName: string;
  url: string;
}
@Component({
  selector: 'app-table-cell-service-instance-apps-attached',
  templateUrl: './table-cell-service-instance-apps-attached.component.html',
  styleUrls: ['./table-cell-service-instance-apps-attached.component.scss']
})
export class TableCellServiceInstanceAppsAttachedComponent<T> extends TableCellCustom<T> implements OnInit {

  boundApps: BoundApp[];
  @Input('row') row;

  constructor(private activatedRoute: ActivatedRoute) {
    super();

  }

  ngOnInit() {

    const parentRoute = this.activatedRoute.pathFromRoot.filter(route => !!route.snapshot.params['cfId'])[0];
    const cfGuid = parentRoute && parentRoute.snapshot.params['cfId'];
    this.boundApps = this.row.entity.service_bindings
      .map(a => {
        return {
          appName: a.entity.app.entity.name,
          url: `applications/${cfGuid}/${a.entity.app.metadata.guid}`
        };
      });

  }

}
