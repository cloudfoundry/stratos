import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { generateCfBaseTestModules } from '../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { CFHomeCardComponent } from './cfhome-card.component';

describe('CFHomeCardComponent', () => {
  let component: CFHomeCardComponent;
  let fixture: ComponentFixture<CFHomeCardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CFHomeCardComponent ],
      imports: generateCfBaseTestModules()
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CFHomeCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
