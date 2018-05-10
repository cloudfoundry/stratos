import { SharedModule } from '../../shared/shared.module';
import { CoreModule } from '../../core/core.module';
import { NoContentMessageComponent } from '../../shared/components/no-content-message/no-content-message.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NoEndpointsNonAdminComponent } from './no-endpoints-non-admin.component';
import { createBasicStoreModule } from '../../test-framework/store-test-helper';
import { RouterTestingModule } from '@angular/router/testing';

describe('NoEndpointsNonAdminComponent', () => {
  let component: NoEndpointsNonAdminComponent;
  let fixture: ComponentFixture<NoEndpointsNonAdminComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [NoEndpointsNonAdminComponent],
      imports: [
        CoreModule,
        RouterTestingModule,
        SharedModule,
        createBasicStoreModule(),
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NoEndpointsNonAdminComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
