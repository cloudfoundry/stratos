import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { StoreModule } from '@ngrx/store';

import { CoreModule } from '../../../core/core.module';
import { MDAppModule } from '../../../core/md.module';
import { SharedModule } from '../../../shared/shared.module';
import { entitiesReducer } from '../../../store/reducers/entity.reducer';
import { paginationReducer } from '../../../store/reducers/pagination.reducer';
import { ApplicationWallComponent } from './application-wall.component';

describe('ApplicationWallComponent', () => {
  let component: ApplicationWallComponent;
  let fixture: ComponentFixture<ApplicationWallComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ApplicationWallComponent],
      imports: [
        RouterTestingModule,
        StoreModule.forRoot({
          entities: entitiesReducer,
          pagination: paginationReducer
        }),
        MDAppModule,
        SharedModule,
        CoreModule
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
