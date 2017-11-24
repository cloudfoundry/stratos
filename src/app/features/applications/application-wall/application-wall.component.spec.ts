import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { StoreModule } from '@ngrx/store';

import { CoreModule } from '../../../core/core.module';
import { MDAppModule } from '../../../core/md.module';
import { SharedModule } from '../../../shared/shared.module';
import { entitiesReducer } from '../../../store/reducers/entity.reducer';
import { paginationReducer } from '../../../store/reducers/pagination.reducer';
import { ApplicationWallComponent } from './application-wall.component';
import { DatePipe } from '@angular/common';
import { getInitialTestStoreState } from '../../../test-framework/store-test-helper';
import { appReducers } from '../../../store/reducers.module';

describe('ApplicationWallComponent', () => {
  let component: ApplicationWallComponent;
  let fixture: ComponentFixture<ApplicationWallComponent>;
  const initialState = getInitialTestStoreState();

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ApplicationWallComponent],
      imports: [
        BrowserAnimationsModule,
        StoreModule.forRoot(appReducers,
          {
            initialState
          }),
        CoreModule,
        SharedModule,
        RouterTestingModule,
      ],
      providers: [
        DatePipe
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ApplicationWallComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
