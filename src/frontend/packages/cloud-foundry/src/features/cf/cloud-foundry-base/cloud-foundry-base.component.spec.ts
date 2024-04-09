import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { CloudFoundryEndpointService } from '../services/cloud-foundry-endpoint.service';
import { CloudFoundryBaseComponent } from './cloud-foundry-base.component';

describe('CloudFoundryBaseComponent', () => {
  let component: CloudFoundryBaseComponent;
  let fixture: ComponentFixture<CloudFoundryBaseComponent>;
  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        declarations: [CloudFoundryBaseComponent],
        imports: [RouterTestingModule],
        providers: [CloudFoundryEndpointService]
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(CloudFoundryBaseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
