import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GithubTabComponent } from './github-tab.component';
import { CoreModule } from '../../../../../../core/core.module';
import { RouterTestingModule } from '@angular/router/testing';
import { ApplicationService } from '../../../../application.service';
import { ApplicationServiceMock } from '../../../../../../test-framework/application-service-helper';
import { StoreModule } from '@ngrx/store';
import { appReducers } from '../../../../../../store/reducers.module';
import { getInitialTestStoreState } from '../../../../../../test-framework/store-test-helper';

describe('GithubTabComponent', () => {
  let component: GithubTabComponent;
  let fixture: ComponentFixture<GithubTabComponent>;
  const initialState = getInitialTestStoreState();

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GithubTabComponent ],
      imports: [
        CoreModule,
        RouterTestingModule,
        StoreModule.forRoot(
          appReducers,
          {
            initialState
          }
        ),
      ],
      providers: [
        { provide: ApplicationService, useClass: ApplicationServiceMock },
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GithubTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
