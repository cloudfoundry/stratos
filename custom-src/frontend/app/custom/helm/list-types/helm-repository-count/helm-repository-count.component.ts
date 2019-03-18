import { Component, OnInit, Input } from '@angular/core';
import { TableCellCustom } from '../../../../shared/components/list/list.types';
import { MonocularChart } from '../../store/helm.types';

@Component({
  selector: 'app-helm-repository-count',
  templateUrl: './helm-repository-count.component.html',
  styleUrls: ['./helm-repository-count.component.scss']
})
export class HelmRepositoryCountComponent extends TableCellCustom<any> implements OnInit {


  @Input() row: MonocularChart;

  constructor() {
    super();
   }

  ngOnInit() {

    // Get the count for this row

    console.log(this.row);

  }

}
