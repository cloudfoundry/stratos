import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TabNavService } from '../../../../../tab-nav.service';
import { BaseTestModulesNoShared } from '../../../../../test-framework/core-test.helper';
import { SharedModule } from '../../../../shared/shared.module';
import { BackupEndpointsComponent } from './backup-endpoints.component';

describe('BackupEndpointsComponent', () => {
  let component: BackupEndpointsComponent;
  let fixture: ComponentFixture<BackupEndpointsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [BackupEndpointsComponent],
      imports: [
        ...BaseTestModulesNoShared,
        SharedModule
      ],
      providers: [
        TabNavService
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BackupEndpointsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
