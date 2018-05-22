import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DeployApplicationFsComponent } from './deploy-application-fs.component';
import { CoreModule } from '../../../../../core/core.module';
import { RouterTestingModule } from '@angular/router/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { createBasicStoreModule } from '../../../../../test-framework/store-test-helper';
import { SharedModule } from '../../../../../shared/shared.module';

describe('DeployApplicationFsComponent', () => {
  let component: DeployApplicationFsComponent;
  let fixture: ComponentFixture<DeployApplicationFsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DeployApplicationFsComponent ],
      imports: [
        CoreModule,
        SharedModule,
        RouterTestingModule,
        createBasicStoreModule(),
        BrowserAnimationsModule
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DeployApplicationFsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
