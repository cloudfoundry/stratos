import { actionHistoryReducer } from '../../../store/reducers/action-history-reducer';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { MDAppModule } from '../../../core/md.module';
import { SideNavComponent } from './side-nav.component';
import { entitiesReducer } from '../../../store/reducers/entity.reducer';
import { getInitialTestStoreState } from '../../../test-framework/store-test-helper';
import { StoreModule } from '@ngrx/store';

describe('SideNavComponent', () => {
  let component: SideNavComponent;
  let fixture: ComponentFixture<SideNavComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [SideNavComponent],
      imports: [
        RouterTestingModule,
        MDAppModule,
        StoreModule.forRoot({
          actionHistory: actionHistoryReducer,
        }, {
            initialState: getInitialTestStoreState()
          })
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SideNavComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
