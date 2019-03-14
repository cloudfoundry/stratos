import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RepositoryTabComponent } from './repository-tab.component';

describe('RepositoryTabComponent', () => {
  let component: RepositoryTabComponent;
  let fixture: ComponentFixture<RepositoryTabComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RepositoryTabComponent ]
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
