import { entitiesReducer } from '../../store/reducers/entity.reducer';
import { paginationReducer } from '../../../store/reducers/pagination.reducer';
import { StoreModule } from '@ngrx/store';
import { RouterTestingModule } from '@angular/router/testing';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { ApplicationWallComponent } from './application-wall.component';

import { MDAppModule } from './../../../md/md.module';

describe('ApplicationWallComponent', () => {
  let component: ApplicationWallComponent;
  let fixture: ComponentFixture<ApplicationWallComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ApplicationWallComponent ],
      imports: [
        RouterTestingModule,
        StoreModule.forRoot({
          entities: entitiesReducer,
          pagination: paginationReducer
        }),
        MDAppModule
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
