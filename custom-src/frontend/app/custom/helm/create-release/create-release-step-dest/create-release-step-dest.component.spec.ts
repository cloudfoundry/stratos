import { CommonModule } from '@angular/common';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { StoreModule } from '@ngrx/store';

import { CoreModule } from '../../../../core/core.module';
import { appReducers } from '../../../../../../store/src/reducers.module';
import { CreateApplicationStepDestinationComponent } from './create-release-step-dest.component';

describe('CreateReleaseStepDestinationComponent', () => {
  let component: CreateApplicationStepDestinationComponent;
  let fixture: ComponentFixture<CreateApplicationStepDestinationComponent>;

  const initialState = { };

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CreateApplicationStepDestinationComponent],
      imports: [
        CommonModule,
        CoreModule,
        BrowserAnimationsModule,
        StoreModule.forRoot(
          appReducers,
          {
            initialState
          }
        )
      ],
      providers: []
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateApplicationStepDestinationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
