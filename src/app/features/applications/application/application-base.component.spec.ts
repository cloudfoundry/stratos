import { paginationReducer } from '../../../store/reducers/pagination.reducer';
import { entitiesReducer } from '../../../store/reducers/entity.reducer';
import { StoreModule } from '@ngrx/store';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { ApplicationBaseComponent } from './application-base.component';

describe('ApplicationPageComponent', () => {
  let component: ApplicationBaseComponent;
  let fixture: ComponentFixture<ApplicationBaseComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ApplicationBaseComponent ],
      imports: [
        RouterTestingModule,
        StoreModule.forRoot({
          entities: entitiesReducer,
          pagination: paginationReducer
        })
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ApplicationBaseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
