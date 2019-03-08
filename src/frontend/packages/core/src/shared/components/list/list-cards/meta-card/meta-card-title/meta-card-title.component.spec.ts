import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MetaCardTitleComponent } from './meta-card-title.component';
import { SharedModule } from '../../../../../shared.module';

describe('MetaCardTitleComponent', () => {
  let component: MetaCardTitleComponent;
  let fixture: ComponentFixture<MetaCardTitleComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        SharedModule
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MetaCardTitleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
