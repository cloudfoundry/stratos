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
        StoreModule,
        CoreModule
      ],
      declarations: [LogStreamTabComponent]
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
