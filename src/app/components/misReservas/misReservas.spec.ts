import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MisReservas } from './misReservas';

describe('MisReservas', () => {
  let component: MisReservas;
  let fixture: ComponentFixture<MisReservas>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MisReservas],
    }).compileComponents();

    fixture = TestBed.createComponent(MisReservas);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
