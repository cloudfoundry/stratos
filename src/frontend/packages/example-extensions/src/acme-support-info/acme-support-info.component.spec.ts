import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { AcmeSupportInfoComponent } from './acme-support-info.component';
import { CoreModule } from '../../core/core.module';
import { SharedModule } from '../../shared/shared.module';

describe('AcmeSupportInfoComponent', () => {
  let component: AcmeSupportInfoComponent;
  let fixture: ComponentFixture<AcmeSupportInfoComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ AcmeSupportInfoComponent ],
      imports: [
        CoreModule,
        SharedModule
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AcmeSupportInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
