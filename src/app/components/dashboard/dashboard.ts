import { Component, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ChangeDetectionStrategy } from '@angular/core';

import {
  ReservasService,
  Reserva
} from '../../services/reservas';

interface ReservaOcupada extends Reserva {
  horaFin?: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent implements OnInit {

  fechaMinima = this.formatearFechaLocal(new Date());

  reserva: Reserva = {
    espacio: '',
    aula: '',
    fecha: '',
    hora: '',
    duracion: 1
  };

  mensaje = signal('');
  cargando = signal(false);
  reservasOcupadas = signal<ReservaOcupada[]>([]);
  aulasFiltradas = signal<string[]>([]);
  fechasProximas = signal<string[]>([]);
  horasParaFechaSeleccionada = signal<Array<{hora: string, disponible: boolean}>>([]);
  reservasDelUsuario = signal<ReservaOcupada[]>([]);
  usuarioId: string = '';

  // Mapa de aulas por espacio
  aulasDisponibles: { [key: string]: string[] } = {
    'Salas de estudio': ['Aula 504', 'Aula 302', 'Aula 533', 'Aula 404', 'Aula 200'],
    'Laboratorios': ['Laboratorio 408', 'Laboratorio 502', 'Laboratorio L04', 'Laboratorio L06'],
    'Zonas colaborativas': ['Zona 1', 'Zona 2', 'Zona 3', 'Zona 4'],
    'Áreas de reunión': ['Sala A101', 'Sala B102', 'Sala C103', 'Sala D104']
  };

  constructor(
    private reservasService: ReservasService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Obtener ID del usuario logueado
    const usuarioLogueado = localStorage.getItem('usuarioLogueado');
    if (usuarioLogueado) {
      const usuario = JSON.parse(usuarioLogueado);
      this.usuarioId = usuario.id;
      this.cargarReservasDelUsuario();
    }

    const espacioSeleccionado = localStorage.getItem('espacioSeleccionado');
    if (espacioSeleccionado) {
      this.reserva.espacio = espacioSeleccionado;
      localStorage.removeItem('espacioSeleccionado');
      this.actualizarAulasFiltradas();
      this.cargarReservasOcupadas();
      this.actualizarFechasDisponibles();
    }
  }

  cargarReservasDelUsuario(): void {
    this.reservasService.obtenerReservas().subscribe((reservas) => {
      const miasReservas = reservas
        .filter(r => r.usuarioId === this.usuarioId)
        .map(r => ({
          ...r,
          horaFin: this.calcularHoraFin(r.hora, r.duracion)
        }));

      this.reservasDelUsuario.set(miasReservas);
    });
  }

  cargarReservasOcupadas(): void {
    this.reservasService.obtenerReservas().subscribe((reservas) => {
      const ocupadas = reservas
        .filter(r => r.espacio === this.reserva.espacio)
        .map(r => ({
          ...r,
          horaFin: this.calcularHoraFin(r.hora, r.duracion)
        }));

      this.reservasOcupadas.set(ocupadas);
      
      // Actualizar reservas del usuario
      this.cargarReservasDelUsuario();
      
      // Actualizar horas si hay una fecha seleccionada
      if (this.reserva.fecha) {
        this.actualizarHorasParaFecha();
      }
    });
  }

  calcularHoraFin(hora: string, duracion: number): string {
    const [h, m] = hora.split(':').map(Number);
    const totalMinutos = h * 60 + m + (duracion * 60);
    const horas = Math.floor(totalMinutos / 60);
    const minutos = totalMinutos % 60;
    return `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}`;
  }

  formatearFecha(fecha: string): string {
    const date = new Date(fecha + 'T00:00:00');
    const opciones: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    };
    return date.toLocaleDateString('es-ES', opciones);
  }

  getColorByEspacio(espacio: string): string {
    const colores: { [key: string]: string } = {
      'Laboratorios': '#ef4444',
      'Salas de estudio': '#3b82f6',
      'Zonas colaborativas': '#10b981',
      'Áreas de reunión': '#f59e0b'
    };
    return colores[espacio] || '#2563eb';
  }

  generarFechasProximas(): string[] {
    const fechas: string[] = [];
    const hoy = new Date();
    
    for (let i = 0; fechas.length < 30; i++) {
      const fecha = new Date(hoy);
      fecha.setDate(fecha.getDate() + i);
      
      // Saltar domingos
      if (fecha.getDay() === 0) continue;
      
      fechas.push(this.formatearFechaLocal(fecha));
    }
    
    return fechas;
  }

  private formatearFechaLocal(fecha: Date): string {
    const anio = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    return `${anio}-${mes}-${dia}`;
  }

  esSabado(fecha: string): boolean {
    const date = new Date(fecha + 'T00:00:00');
    return date.getDay() === 6;
  }

  obtenerHoraCierre(fecha: string): string {
    return this.esSabado(fecha) ? '17:00' : '21:00';
  }

  esFechaActual(fecha: string): boolean {
    return fecha === this.formatearFechaLocal(new Date());
  }

  esHoraPasada(fecha: string, hora: string): boolean {
    if (!this.esFechaActual(fecha)) {
      return false;
    }

    const ahora = new Date();
    const [h, m] = hora.split(':').map(Number);
    const inicioReserva = new Date(ahora);
    inicioReserva.setHours(h, m, 0, 0);

    return inicioReserva <= ahora;
  }

  esHoraOcupada(fecha: string, hora: string): boolean {
    if (!this.reserva.aula) return false;

    const duracion = 1; // Asumir 1 hora para verificación
    const [h, m] = hora.split(':').map(Number);
    const totalMinutos = h * 60 + m + (duracion * 60);
    const horas = Math.floor(totalMinutos / 60);
    const minutos = totalMinutos % 60;
    const horaFin = `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}`;

    return this.reservasOcupadas().some(res => {
      if (res.aula !== this.reserva.aula || res.fecha !== fecha) {
        return false;
      }

      const [resH, resM] = res.hora.split(':').map(Number);
      const resInicioMin = resH * 60 + resM;

      const [finH, finM] = horaFin.split(':').map(Number);
      const finMin = finH * 60 + finM;

      const [resFinH, resFinM] = (res.horaFin || '').split(':').map(Number);
      const resFinMin = resFinH * 60 + resFinM;

      const [solH, solM] = hora.split(':').map(Number);
      const solInicioMin = solH * 60 + solM;

      return !(finMin <= resInicioMin || solInicioMin >= resFinMin);
    });
  }

  esDiaOcupado(fecha: string): boolean {
    if (!this.reserva.aula) return false;
    
    const horasDisponibles = this.generarHorasDisponibles(fecha);
    return horasDisponibles.every(hora => this.esHoraOcupada(fecha, hora));
  }

  generarHorasDisponibles(fecha: string): string[] {
    const horas: string[] = [];
    const horaCierre = parseInt(this.obtenerHoraCierre(fecha).split(':')[0], 10);

    for (let h = 7; h < horaCierre; h++) {
      const hora = `${String(h).padStart(2, '0')}:00`;
      if (!this.esHoraPasada(fecha, hora)) {
        horas.push(hora);
      }
    }
    return horas;
  }

  obtenerHorasDisponiblesParaFecha(fecha: string): Array<{hora: string, disponible: boolean}> {
    return this.generarHorasDisponibles(fecha).map(hora => ({
      hora,
      disponible: !this.esHoraOcupada(fecha, hora)
    }));
  }

  seleccionarFecha(fecha: string): void {
    this.reserva.fecha = fecha;
  }

  seleccionarHora(hora: string): void {
    this.reserva.hora = hora;
  }

  obtenerNombreMes(fecha: string): string {
    const date = new Date(fecha + 'T00:00:00');
    return date.toLocaleDateString('es-ES', { month: 'short' }).toUpperCase();
  }

  obtenerDiaSemana(fecha: string): string {
    const date = new Date(fecha + 'T00:00:00');
    return date.toLocaleDateString('es-ES', { weekday: 'short' }).toUpperCase();
  }

  onEspacioChange(): void {
    this.reserva.aula = '';
    this.reserva.fecha = '';
    this.reserva.hora = '';
    this.cargarReservasOcupadas();
    this.actualizarAulasFiltradas();
    this.actualizarFechasDisponibles();
  }

  onAulaChange(): void {
    this.reserva.hora = '';

    if (this.reserva.fecha) {
      this.actualizarHorasParaFecha();
    }
  }

  actualizarFechasDisponibles(): void {
    const fechas = this.generarFechasProximas();
    this.fechasProximas.set(fechas);
  }

  actualizarHorasParaFecha(): void {
    if (this.reserva.fecha) {
      const horas = this.obtenerHorasDisponiblesParaFecha(this.reserva.fecha);
      this.horasParaFechaSeleccionada.set(horas);
      if (this.reserva.hora && !horas.some(h => h.hora === this.reserva.hora && h.disponible)) {
        this.reserva.hora = '';
      }
    } else {
      this.horasParaFechaSeleccionada.set([]);
    }
  }

  actualizarAulasFiltradas(): void {
    const aulasDisp = this.aulasDisponibles[this.reserva.espacio] || [];
    this.aulasFiltradas.set(aulasDisp);
  }

  esDomingo(fecha: string): boolean {
    const date = new Date(fecha + 'T00:00:00');
    return date.getDay() === 0;
  }

  hayConflictoHorario(): boolean {
    const horaInicio = this.reserva.hora;
    const duracion = this.reserva.duracion;
    const fecha = this.reserva.fecha;
    const aula = this.reserva.aula;

    // Calcular hora fin
    const [h, m] = horaInicio.split(':').map(Number);
    const totalMinutos = h * 60 + m + (duracion * 60);
    const horas = Math.floor(totalMinutos / 60);
    const minutos = totalMinutos % 60;
    const horaFin = `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}`;

    // Verificar conflictos con reservas existentes en la misma aula y fecha
    return this.reservasOcupadas().some(res => {
      if (res.aula !== aula || res.fecha !== fecha) {
        return false;
      }

      const resHoraInicio = res.hora;
      const resHoraFin = res.horaFin || '';

      // Convertir a minutos para comparación
      const [resH, resM] = resHoraInicio.split(':').map(Number);
      const resInicioMin = resH * 60 + resM;

      const [finH, finM] = horaFin.split(':').map(Number);
      const finMin = finH * 60 + finM;

      const [resFinH, resFinM] = resHoraFin.split(':').map(Number);
      const resFinMin = resFinH * 60 + resFinM;

      const [solH, solM] = horaInicio.split(':').map(Number);
      const solInicioMin = solH * 60 + solM;

      // Verificar si hay solapamiento
      return !(finMin <= resInicioMin || solInicioMin >= resFinMin);
    });
  }

  hayConflictoConOtrasReservas(): boolean {
    const horaInicio = this.reserva.hora;
    const duracion = this.reserva.duracion;
    const fecha = this.reserva.fecha;

    // Calcular hora fin
    const [h, m] = horaInicio.split(':').map(Number);
    const totalMinutos = h * 60 + m + (duracion * 60);
    const horas = Math.floor(totalMinutos / 60);
    const minutos = totalMinutos % 60;
    const horaFin = `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}`;

    // Verificar conflictos con TODAS las reservas del usuario en la misma fecha
    // Sin importar el espacio o aula
    return this.reservasDelUsuario().some(res => {
      if (res.fecha !== fecha) {
        return false;
      }

      const resHoraInicio = res.hora;
      const resHoraFin = res.horaFin || '';

      // Convertir a minutos para comparación
      const [resH, resM] = resHoraInicio.split(':').map(Number);
      const resInicioMin = resH * 60 + resM;

      const [finH, finM] = horaFin.split(':').map(Number);
      const finMin = finH * 60 + finM;

      const [resFinH, resFinM] = resHoraFin.split(':').map(Number);
      const resFinMin = resFinH * 60 + resFinM;

      const [solH, solM] = horaInicio.split(':').map(Number);
      const solInicioMin = solH * 60 + solM;

      // Verificar si hay solapamiento temporal
      return !(finMin <= resInicioMin || solInicioMin >= resFinMin);
    });
  }

  validarReserva(): boolean {
    this.mensaje.set('');

    if (
      !this.reserva.espacio ||
      !this.reserva.aula ||
      !this.reserva.fecha ||
      !this.reserva.hora ||
      !this.reserva.duracion
    ) {
      this.mensaje.set('Todos los campos son obligatorios');
      return false;
    }

    if (this.reserva.fecha < this.fechaMinima) {
      this.mensaje.set('No puedes reservar una fecha anterior a la actual');
      return false;
    }

    if (this.esDomingo(this.reserva.fecha)) {
      this.mensaje.set('No se pueden hacer reservas los domingos');
      return false;
    }

    const horaCierre = this.obtenerHoraCierre(this.reserva.fecha);

    if (this.reserva.hora < '07:00' || this.reserva.hora >= horaCierre) {
      this.mensaje.set(`La hora debe estar entre 7:00 AM y ${horaCierre}`);
      return false;
    }

    if (this.esHoraPasada(this.reserva.fecha, this.reserva.hora)) {
      this.mensaje.set('No puedes reservar una hora que ya paso');
      return false;
    }

    if (this.reserva.duracion < 1 || this.reserva.duracion > 3) {
      this.mensaje.set('La duración debe ser entre 1 y 3 horas');
      return false;
    }

    // Validar que la reserva no termine después de las 21:00
    const horaFin = this.calcularHoraFin(this.reserva.hora, this.reserva.duracion);
    if (horaFin > horaCierre) {
      const horasDisponibles = parseInt(horaCierre.split(':')[0], 10) - parseInt(this.reserva.hora.split(':')[0], 10);
      this.mensaje.set(
        `No puedes reservar ${this.reserva.duracion} hora(s) a partir de las ${this.reserva.hora}. ` +
        `Máximo disponible: ${horasDisponibles} hora(s).`
      );
      return false;
    }

    if (this.hayConflictoHorario()) {
      this.mensaje.set('Este horario ya está ocupado. Por favor selecciona otro horario o aula');
      return false;
    }

    if (this.hayConflictoConOtrasReservas()) {
      this.mensaje.set('No puedes reservar en este horario. Ya tienes una reserva en otro espacio en la misma fecha y hora. Recuerda que no puedes estar en dos lugares a la vez.');
      return false;
    }

    return true;
  }

  guardarReserva() {
    if (!this.validarReserva()) {
      return;
    }

    const usuarioLogueado = localStorage.getItem('usuarioLogueado');

    if (usuarioLogueado) {
      const usuario = JSON.parse(usuarioLogueado);
      this.reserva.usuarioId = usuario.id;
    }

    this.cargando.set(true);

    this.reservasService.agregarReserva(this.reserva)
      .then((docRef) => {
        console.log('Reserva guardada exitosamente con ID:', docRef.id);
        this.mensaje.set('Reserva guardada correctamente');

        // Guardar la reserva reciente en localStorage
        const reservaCompleta = {
          id: docRef.id,
          ...this.reserva
        };
        localStorage.setItem('reservaReciente', JSON.stringify(reservaCompleta));

        setTimeout(() => {
          this.router.navigate(['/hoja-confirmacion']);
        }, 800);
      })
      .catch((error) => {
        console.error('Error al guardar la reserva:', error);
        this.mensaje.set('Error al guardar la reserva: ' + error.message);
        this.cargando.set(false);
      });
  }
}


