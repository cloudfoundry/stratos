import { paginationReducer } from '../../store/reducers/pagination.reducer';
import { entitiesReducer } from '../../store/reducers/api.reducer';
import { StoreModule } from '@ngrx/store';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { ApplicationPageComponent } from './application-page.component';

describe('ApplicationPageComponent', () => {
  let component: ApplicationPageComponent;
  let fixture: ComponentFixture<ApplicationPageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ApplicationPageComponent ],
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
    fixture = TestBed.createComponent(ApplicationPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
