import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PageNotFoundComponentComponent } from './page-not-found-component.component';
import { CoreModule } from '../core.module';
import { SharedModule } from '../../shared/shared.module';
import { MatIcon } from '@angular/material/icon';

describe('PageNotFoundComponentComponent', () => {
  let component: PageNotFoundComponentComponent;
  let fixture: ComponentFixture<PageNotFoundComponentComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PageNotFoundComponentComponent, MatIcon ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PageNotFoundComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
