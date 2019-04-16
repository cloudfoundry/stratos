import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HelmBaseTestModules } from '../../helm-testing.module';
import { RepositoryTabComponent } from './repository-tab.component';

describe('RepositoryTabComponent', () => {
  let component: RepositoryTabComponent;
  let fixture: ComponentFixture<RepositoryTabComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        ...HelmBaseTestModules
      ],
      declarations: [RepositoryTabComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RepositoryTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
