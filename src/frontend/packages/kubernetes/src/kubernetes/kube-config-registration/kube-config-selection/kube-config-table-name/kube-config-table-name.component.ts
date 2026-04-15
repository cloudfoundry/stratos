import { ChangeDetectionStrategy, Component} from '@angular/core';
import { FormsModule } from '@angular/forms';

import { TableCellEditComponent } from '../../../../../../core/src/shared/components/list/list-table/table-cell-edit/table-cell-edit.component';
import { TableCellCustom } from '../../../../../../core/src/shared/components/list/list.types';
import { KubeConfigFileCluster } from '../../kube-config.types';
import { CustomFormFieldComponent } from '../../../../../../core/src/shared/components/custom-form-field/custom-form-field.component';

@Component({
changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-kube-config-table-name',
  templateUrl: './kube-config-table-name.component.html',
  standalone: true,
  imports: [
    FormsModule,
    CustomFormFieldComponent,
    TableCellEditComponent,
  ]
})
export class KubeConfigTableNameComponent extends TableCellCustom<KubeConfigFileCluster> { }
