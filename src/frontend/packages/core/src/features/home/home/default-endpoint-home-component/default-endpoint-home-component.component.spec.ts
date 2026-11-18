import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { EndpointModel } from '../../../../../../store/src/public-api';
import { DefaultEndpointHomeComponent } from './default-endpoint-home-component.component';

describe('DefaultEndpointHomeComponentComponent', () => {
  let component: DefaultEndpointHomeComponent;
  let fixture: ComponentFixture<DefaultEndpointHomeComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
      imports: [ DefaultEndpointHomeComponent ]
    });
    TestBed.compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DefaultEndpointHomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('offers a line break between the parts of the address, not inside them', async () => {
    const url = 'https://autoscaler.system.example.io';
    const card = TestBed.createComponent(DefaultEndpointHomeComponent);
    card.componentRef.setInput('endpoint', {
      api_endpoint: { Scheme: 'https', Host: 'autoscaler.system.example.io', Path: '' },
    } as unknown as EndpointModel);
    await card.whenStable();

    const value = card.nativeElement.querySelector('app-metadata-item .metadata-item__value') as HTMLElement;
    expect(value.textContent?.trim()).toBe(url);
    expect(value.querySelectorAll('wbr').length).toBeGreaterThan(3);
    expect(value.querySelector('.break-all')).toBeNull();
  });
});
