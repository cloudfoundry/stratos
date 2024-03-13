import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { createBasicStoreModule } from '../../../../../../../store/testing/public-api';
import { CoreTestingModule } from '../../../../../../test-framework/core-test.modules';
import { CoreModule } from '../../../../../core/core.module';
import { SharedModule } from '../../../../shared.module';
import { ListViewComponent } from './list-view.component';

describe('ListViewComponent', () => {
  let component: ListViewComponent<any>;
  let fixture: ComponentFixture<ListViewComponent<any>>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        CoreModule,
        SharedModule,
        CoreTestingModule,
        createBasicStoreModule(),
        NoopAnimationsModule
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ListViewComponent);
    component = fixture.componentInstance;
    component.config = {
      getListConfig: () => null,
      updateDataSourceConfig: () => null,
      updateListConfig: () => null
    };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
