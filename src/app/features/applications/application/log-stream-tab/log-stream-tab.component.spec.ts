import { CommonModule } from '@angular/common';
import { RouterTestingModule } from '@angular/router/testing';
import { MDAppModule } from '../../../../core/md.module';
import { LogViewerComponent } from '../../../../shared/components/log-viewer/log-viewer.component';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { StoreModule } from '@ngrx/store';

import { CoreModule } from '../../../../core/core.module';
import { LogStreamTabComponent } from './log-stream-tab.component';

describe('LogStreamTabComponent', () => {
  let component: LogStreamTabComponent;
  let fixture: ComponentFixture<LogStreamTabComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        MDAppModule,
        RouterTestingModule,
        CommonModule,
        CoreModule
      ],
      declarations: [
        LogViewerComponent,
        LogStreamTabComponent
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LogStreamTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
