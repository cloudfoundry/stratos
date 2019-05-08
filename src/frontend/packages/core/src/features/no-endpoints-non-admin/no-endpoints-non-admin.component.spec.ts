import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { TabNavService } from '../../../tab-nav.service';
import { createBasicStoreModule } from '../../../test-framework/store-test-helper';
import { CoreModule } from '../../core/core.module';
import { SharedModule } from '../../shared/shared.module';
import { NoEndpointsNonAdminComponent } from './no-endpoints-non-admin.component';

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
      ],
      providers: [TabNavService]
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
