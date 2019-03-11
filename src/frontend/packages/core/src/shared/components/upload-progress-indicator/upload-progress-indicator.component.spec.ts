import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { UploadProgressIndicatorComponent } from './upload-progress-indicator.component';
import { MDAppModule } from '../../../core/md.module';
import { CommonModule } from '@angular/common';
import { CoreModule } from '../../../core/core.module';

describe('UploadProgressIndicatorComponent', () => {
  let component: UploadProgressIndicatorComponent;
  let fixture: ComponentFixture<UploadProgressIndicatorComponent>;

  beforeEach(async(() => {
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
