import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { RouterLink, Router } from '@angular/router';

import {
  ReservasService,
  Reserva
} from '../../services/reservas';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    RouterLink
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home implements OnInit {

  calendarOptions: any = {
    initialView: 'timeGridWeek',
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay'
    },
    events: []
  };

  constructor(
    private reservasService: ReservasService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.cargarCalendario();
  }

  cargarCalendario() {

    this.reservasService.obtenerReservas()
      .subscribe((reservas) => {

        const eventos = reservas.map(r => {

          // 🔥 FIX: evitar undefined
          if (!r.fecha || !r.hora) return null;

          const inicio = new Date(`${r.fecha}T${r.hora}`);

          if (isNaN(inicio.getTime())) return null;

          const fin = new Date(inicio);
          fin.setHours(fin.getHours() + r.duracion);

          // 🎨 COLORES POR ESPACIO
          let color = '#2563eb'; // default azul

          switch (r.espacio) {

            case 'Laboratorios':
              color = '#ef4444'; // rojo
              break;

            case 'Salas de estudio':
              color = '#3b82f6'; // azul
              break;

            case 'Zonas colaborativas':
              color = '#10b981'; // verde
              break;

            case 'Áreas de reunión':
              color = '#f59e0b'; // amarillo
              break;
          }

          return {
            title: r.espacio,
            start: inicio,
            end: fin,

            backgroundColor: color,
            borderColor: color,
            textColor: '#ffffff'
          };
        })

        // eliminar nulls
        .filter(e => e !== null);

        this.calendarOptions = {
          initialView: 'timeGridWeek',
          headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
          },
          events: [...eventos]
        };
      });
  }

  irAReservar(espacio: string) {
    localStorage.setItem('espacioSeleccionado', espacio);
    this.router.navigate(['/dashboard']);
  }
}