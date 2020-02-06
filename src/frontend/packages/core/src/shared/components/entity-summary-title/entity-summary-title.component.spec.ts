import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CoreModule } from '../../../core/core.module';
import { EntitySummaryTitleComponent } from './entity-summary-title.component';

describe('EntitySummaryTitleComponent', () => {
  let component: EntitySummaryTitleComponent;
  let fixture: ComponentFixture<EntitySummaryTitleComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        CoreModule,
      ],
      declarations: [EntitySummaryTitleComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EntitySummaryTitleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
