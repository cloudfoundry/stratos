import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { UploadProgressIndicatorComponent } from './upload-progress-indicator.component';
import { MDAppModule } from '../../../core/md.module';
import { CommonModule } from '@angular/common';
import { CoreModule } from '../../../core/core.module';

describe('UploadProgressIndicatorComponent', () => {
  let component: UploadProgressIndicatorComponent;
  let fixture: ComponentFixture<UploadProgressIndicatorComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ UploadProgressIndicatorComponent ],
      imports: [
        MDAppModule,
        CommonModule,
        CoreModule,
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UploadProgressIndicatorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
