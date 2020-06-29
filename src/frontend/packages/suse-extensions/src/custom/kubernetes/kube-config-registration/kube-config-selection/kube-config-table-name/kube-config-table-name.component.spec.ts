import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { IListDataSource } from '../../../../../shared/components/list/data-sources-controllers/list-data-source-types';
import { KubernetesBaseTestModules } from '../../../kubernetes.testing.module';
import { KubeConfigFileCluster } from '../../kube-config.types';
import { KubeConfigTableName } from './kube-config-table-name.component';

describe('KubeConfigTableName', () => {
  let component: KubeConfigTableName;
  let fixture: ComponentFixture<KubeConfigTableName>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        ...KubernetesBaseTestModules
      ],
      declarations: [KubeConfigTableName]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(KubeConfigTableName);
    component = fixture.componentInstance;
    component.dataSource = {
      getRowUniqueId: (row) => ""
    } as IListDataSource<KubeConfigFileCluster>
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
