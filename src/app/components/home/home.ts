import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';

import {
  ReservasService,
  Reserva
} from '../../services/reservas';

import { FullCalendarModule } from '@fullcalendar/angular';

import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

import { CalendarOptions } from '@fullcalendar/core';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    RouterLink,
    FullCalendarModule
  ],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home implements OnInit {

  calendarOptions: CalendarOptions = {
    initialView: 'timeGridWeek',

    plugins: [
      dayGridPlugin,
      timeGridPlugin,
      interactionPlugin
    ],

    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,timeGridDay'
    },

    events: []
  };

  constructor(
    private reservasService: ReservasService
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

          plugins: [
            dayGridPlugin,
            timeGridPlugin,
            interactionPlugin
          ],

          headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
          },

          events: [...eventos]
        };
      });
  }
}