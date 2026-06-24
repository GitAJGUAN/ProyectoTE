import {
  AfterViewInit,
  Component,
  CUSTOM_ELEMENTS_SCHEMA,
  ElementRef,
  OnInit,
  ViewChild,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';

import {
  ReservasService,
  Reserva
} from '../../services/reservas';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home implements OnInit, AfterViewInit {

  @ViewChild('fechaHoyTextoEl') fechaHoyTextoEl?: ElementRef<HTMLElement>;

  fechaHoy: string;
  fechaHoyTexto: string;
  disponibilidadHoy = signal<Array<{ espacio: string; disponibles: number; total: number }>>([]);

  private aulasDisponibles: { [key: string]: string[] } = {
    'Salas de estudio': ['Aula 504', 'Aula 302', 'Aula 533', 'Aula 404', 'Aula 200'],
    'Laboratorios': ['Laboratorio 408', 'Laboratorio 502', 'Laboratorio L04', 'Laboratorio L06'],
    'Zonas colaborativas': ['Zona 1', 'Zona 2', 'Zona 3', 'Zona 4'],
    'Áreas de reunión': ['Sala A101', 'Sala B102', 'Sala C103', 'Sala D104']
  };

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
  ) {
    const hoy = new Date();
    this.fechaHoy = this.formatearFechaLocal(hoy);
    this.fechaHoyTexto = this.formatearFechaVista(hoy);
  }

  ngOnInit(): void {
    this.cargarCalendario();
  }

  ngAfterViewInit(): void {
    if (this.fechaHoyTextoEl) {
      this.fechaHoyTextoEl.nativeElement.textContent = this.fechaHoyTexto;
    }
  }

  private formatearFechaLocal(fecha: Date): string {
    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    return `${anio}-${mes}-${dia}`;
  }

  private formatearFechaVista(fecha: Date): string {
    return fecha.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  private esSabado(fecha: string): boolean {
    const date = new Date(fecha + 'T00:00:00');
    return date.getDay() === 6;
  }

  private esDomingo(fecha: string): boolean {
    const date = new Date(fecha + 'T00:00:00');
    return date.getDay() === 0;
  }

  private obtenerHoraCierre(fecha: string): string {
    return this.esSabado(fecha) ? '17:00' : '21:00';
  }

  private esHoraPasada(fecha: string, hora: string): boolean {
    if (fecha !== this.fechaHoy) {
      return false;
    }

    const ahora = new Date();
    const [h, m] = hora.split(':').map(Number);
    const inicioReserva = new Date(ahora);
    inicioReserva.setHours(h, m, 0, 0);

    return inicioReserva <= ahora;
  }

  private obtenerProximaHoraReservable(): string | null {
    if (this.esDomingo(this.fechaHoy)) {
      return null;
    }

    const horaCierre = parseInt(this.obtenerHoraCierre(this.fechaHoy).split(':')[0], 10);

    for (let h = 7; h < horaCierre; h++) {
      const hora = `${String(h).padStart(2, '0')}:00`;
      if (!this.esHoraPasada(this.fechaHoy, hora)) {
        return hora;
      }
    }

    return null;
  }

  private calcularHoraFin(hora: string, duracion: number): string {
    const [h, m] = hora.split(':').map(Number);
    const totalMinutos = h * 60 + m + (duracion * 60);
    const horas = Math.floor(totalMinutos / 60);
    const minutos = totalMinutos % 60;
    return `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}`;
  }

  private hayConflictoConReserva(horaInicio: string, horaFin: string, reserva: Reserva): boolean {
    const [inicioH, inicioM] = horaInicio.split(':').map(Number);
    const [finH, finM] = horaFin.split(':').map(Number);
    const [resInicioH, resInicioM] = reserva.hora.split(':').map(Number);
    const [resFinH, resFinM] = this.calcularHoraFin(reserva.hora, reserva.duracion).split(':').map(Number);

    const inicioMin = inicioH * 60 + inicioM;
    const finMin = finH * 60 + finM;
    const resInicioMin = resInicioH * 60 + resInicioM;
    const resFinMin = resFinH * 60 + resFinM;

    return !(finMin <= resInicioMin || inicioMin >= resFinMin);
  }

  private actualizarDisponibilidadHoy(reservas: Reserva[]): void {
    const proximaHora = this.obtenerProximaHoraReservable();
    const reservasHoy = reservas.filter(r => r.fecha === this.fechaHoy && r.hora && r.espacio && r.aula);

    const disponibilidad = Object.entries(this.aulasDisponibles).map(([espacio, aulas]) => {
      let disponibles = 0;

      if (proximaHora) {
        const horaFin = this.calcularHoraFin(proximaHora, 1);

        for (const aula of aulas) {
          const ocupado = reservasHoy.some(reserva =>
            reserva.espacio === espacio &&
            reserva.aula === aula &&
            this.hayConflictoConReserva(proximaHora, horaFin, reserva)
          );

          if (!ocupado) {
            disponibles++;
          }
        }
      }

      return { espacio, disponibles, total: aulas.length };
    });

    this.disponibilidadHoy.set(disponibilidad);
  }

  cargarCalendario() {

    this.reservasService.obtenerReservas()
      .subscribe((reservas) => {
        this.actualizarDisponibilidadHoy(reservas);

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
