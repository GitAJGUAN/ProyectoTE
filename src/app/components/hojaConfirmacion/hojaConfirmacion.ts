import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ReservasService, Reserva } from '../../services/reservas';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

interface ReservaOcupada extends Reserva {
  horaFin?: string;
}

@Component({
  selector: 'app-hoja-confirmacion',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './hojaConfirmacion.html',
  styleUrl: './hojaConfirmacion.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HojaConfirmacion implements OnInit, OnDestroy {
  reserva = signal<Reserva | null>(null);
  mensaje = signal('');
  mensajeError = signal('');
  reservaEditando = signal(false);
  mostrandoConfirmacionEliminar = signal(false);
  fechasProximas = signal<string[]>([]);
  horasParaFechaSeleccionada = signal<Array<{hora: string, disponible: boolean}>>([]);
  reservasDelUsuario = signal<ReservaOcupada[]>([]);
  cargando = signal(false);
  fechaMinima = this.formatearFechaLocal(new Date());
  private destroy$ = new Subject<void>();

  constructor(
    private reservasService: ReservasService,
    private router: Router
  ) {}

  ngOnInit() {
    this.cargarReservaReciente();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  cargarReservaReciente() {
    // Obtener la reserva reciente del localStorage
    const reservaRecienteJson = localStorage.getItem('reservaReciente');
    
    if (!reservaRecienteJson) {
      this.router.navigate(['/mis-reservas']);
      return;
    }

    const reservaReciente = JSON.parse(reservaRecienteJson);
    this.reserva.set(reservaReciente);
    
    // Cargar también las reservas del usuario para validaciones
    this.cargarReservasDelUsuario();
    this.generarFechasProximas();
  }

  cargarReservasDelUsuario() {
    const usuarioLogueado = localStorage.getItem('usuarioLogueado');
    if (!usuarioLogueado) {
      this.router.navigate(['/login']);
      return;
    }

    const usuario = JSON.parse(usuarioLogueado);
    this.reservasService.obtenerReservas()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (datos) => {
          const miasReservas = datos
            .filter(r => r.usuarioId === usuario.id)
            .map(r => ({
              ...r,
              horaFin: this.calcularHoraFin(r.hora, r.duracion)
            }));
          this.reservasDelUsuario.set(miasReservas);

          const reservaActual = this.reserva();
          if (reservaActual?.id && !this.esHoraValida(reservaActual.hora)) {
            const reservaCompleta = miasReservas.find(r => r.id === reservaActual.id);
            if (reservaCompleta?.hora) {
              const reservaRecuperada = {
                ...reservaActual,
                ...reservaCompleta
              };
              this.reserva.set(reservaRecuperada);
              localStorage.setItem('reservaReciente', JSON.stringify(reservaRecuperada));
            }
          }
        }
      });
  }

  calcularHoraFin(hora: string, duracion: number): string {
    if (!this.esHoraValida(hora)) {
      return '';
    }

    const [h, m] = hora.split(':').map(Number);
    const totalMinutos = h * 60 + m + (duracion * 60);
    const horas = Math.floor(totalMinutos / 60);
    const minutos = totalMinutos % 60;
    return `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}`;
  }

  esHoraValida(hora?: string): boolean {
    return !!hora && /^\d{2}:\d{2}$/.test(hora);
  }

  mostrarHorario(reserva: Reserva): string {
    if (!this.esHoraValida(reserva.hora)) {
      return 'Hora no seleccionada';
    }

    return `${reserva.hora} - ${this.calcularHoraFin(reserva.hora, reserva.duracion)}`;
  }

  generarFechasProximas(): void {
    const fechas: string[] = [];
    const hoy = new Date();
    
    for (let i = 0; fechas.length < 30; i++) {
      const fecha = new Date(hoy);
      fecha.setDate(fecha.getDate() + i);
      
      if (fecha.getDay() === 0) continue;
      
      fechas.push(this.formatearFechaLocal(fecha));
    }
    
    this.fechasProximas.set(fechas);
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

  obtenerNombreMes(fecha: string): string {
    const date = new Date(fecha + 'T00:00:00');
    return date.toLocaleDateString('es-ES', { month: 'short' }).toUpperCase();
  }

  obtenerDiaSemana(fecha: string): string {
    const date = new Date(fecha + 'T00:00:00');
    return date.toLocaleDateString('es-ES', { weekday: 'short' }).toUpperCase();
  }

  esDomingo(fecha: string): boolean {
    const date = new Date(fecha + 'T00:00:00');
    return date.getDay() === 0;
  }

  esDiaOcupado(fecha: string): boolean {
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

  esHoraOcupada(fecha: string, hora: string): boolean {
    const reservaActual = this.reserva();
    if (!reservaActual) return false;

    const duracion = 1;
    const [h, m] = hora.split(':').map(Number);
    const totalMinutos = h * 60 + m + (duracion * 60);
    const horas = Math.floor(totalMinutos / 60);
    const minutos = totalMinutos % 60;
    const horaFin = `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}`;

    return this.reservasDelUsuario().some(res => {
      if (res.id === reservaActual.id) return false; // Ignorar la reserva actual
      if (res.espacio !== reservaActual.espacio || res.fecha !== fecha) return false;

      const resHoraInicio = res.hora;
      const resHoraFin = res.horaFin || '';

      const [resH, resM] = resHoraInicio.split(':').map(Number);
      const resInicioMin = resH * 60 + resM;

      const [finH, finM] = horaFin.split(':').map(Number);
      const finMin = finH * 60 + finM;

      const [resFinH, resFinM] = resHoraFin.split(':').map(Number);
      const resFinMin = resFinH * 60 + resFinM;

      const [solH, solM] = hora.split(':').map(Number);
      const solInicioMin = solH * 60 + solM;

      return !(finMin <= resInicioMin || solInicioMin >= resFinMin);
    });
  }

  obtenerHorasDisponiblesParaFecha(fecha: string): Array<{hora: string, disponible: boolean}> {
    return this.generarHorasDisponibles(fecha).map(hora => ({
      hora,
      disponible: !this.esHoraOcupada(fecha, hora)
    }));
  }

  seleccionarFecha(fecha: string): void {
    if (this.reserva()) {
      const nuevaReserva = {...this.reserva()!};
      nuevaReserva.fecha = fecha;
      this.reserva.set(nuevaReserva);
      this.actualizarHorasParaFecha();
    }
  }

  seleccionarHora(hora: string): void {
    if (this.reserva()) {
      const nuevaReserva = {...this.reserva()!};
      nuevaReserva.hora = hora;
      this.reserva.set(nuevaReserva);
    }
  }

  actualizarHorasParaFecha(): void {
    if (this.reserva()?.fecha) {
      const horas = this.obtenerHorasDisponiblesParaFecha(this.reserva()!.fecha);
      this.horasParaFechaSeleccionada.set(horas);
      const reservaActual = this.reserva();
      if (reservaActual?.hora && !horas.some(h => h.hora === reservaActual.hora && h.disponible)) {
        this.reserva.set({
          ...reservaActual,
          hora: ''
        });
      }
    } else {
      this.horasParaFechaSeleccionada.set([]);
    }
  }

  editarReserva() {
    this.reservaEditando.set(true);
    this.generarFechasProximas();
    this.actualizarHorasParaFecha();
  }

  validarEdicion(): boolean {
    this.mensajeError.set('');
    
    if (!this.reserva()) {
      this.mensajeError.set('Reserva no disponible');
      return false;
    }

    const r = this.reserva()!;

    if (!r.espacio || !r.aula || !r.fecha || !r.hora || !r.duracion) {
      this.mensajeError.set('Todos los campos son obligatorios');
      return false;
    }

    if (r.fecha < this.fechaMinima) {
      this.mensajeError.set('No puedes reservar una fecha anterior a la actual');
      return false;
    }

    if (this.esDomingo(r.fecha)) {
      this.mensajeError.set('No se pueden hacer reservas los domingos');
      return false;
    }

    const horaCierre = this.obtenerHoraCierre(r.fecha);

    if (r.hora < '07:00' || r.hora >= horaCierre) {
      this.mensajeError.set(`La hora debe estar entre 7:00 AM y ${horaCierre}`);
      return false;
    }

    if (this.esHoraPasada(r.fecha, r.hora)) {
      this.mensajeError.set('No puedes reservar una hora que ya paso');
      return false;
    }

    if (r.duracion < 1 || r.duracion > 3) {
      this.mensajeError.set('La duración debe ser entre 1 y 3 horas');
      return false;
    }

    const horaFin = this.calcularHoraFin(r.hora, r.duracion);
    if (horaFin > horaCierre) {
      const horasDisponibles = parseInt(horaCierre.split(':')[0], 10) - parseInt(r.hora.split(':')[0], 10);
      this.mensajeError.set(
        `No puedes reservar ${r.duracion} hora(s) a partir de las ${r.hora}. ` +
        `Máximo disponible: ${horasDisponibles} hora(s).`
      );
      return false;
    }

    return true;
  }

  guardarEdicion() {
    if (!this.validarEdicion()) {
      return;
    }

    if (!this.reserva()?.id) return;

    this.cargando.set(true);
    const reservaActual = this.reserva();
    
    this.reservasService.actualizarReserva(reservaActual!.id!, {
      espacio: reservaActual!.espacio,
      aula: reservaActual!.aula,
      fecha: reservaActual!.fecha,
      hora: reservaActual!.hora,
      duracion: reservaActual!.duracion
    }).then(() => {
      this.mensaje.set('Reserva actualizada correctamente');
      this.reservaEditando.set(false);
      this.cargando.set(false);
      // Actualizar localStorage
      localStorage.setItem('reservaReciente', JSON.stringify(reservaActual));
    }).catch(() => {
      this.mensajeError.set('Error al actualizar la reserva');
      this.cargando.set(false);
    });
  }

  abrirConfirmacionEliminar() {
    if (!this.reserva()?.id) return;
    this.mostrandoConfirmacionEliminar.set(true);
  }

  cerrarConfirmacionEliminar() {
    if (this.cargando()) return;
    this.mostrandoConfirmacionEliminar.set(false);
  }

  eliminarReservaConfirmada() {
    if (!this.reserva()?.id) return;

    this.cargando.set(true);
    this.reservasService.eliminarReserva(this.reserva()!.id!).then(() => {
      localStorage.removeItem('reservaReciente');
      this.router.navigate(['/mis-reservas']);
    }).catch(() => {
      this.mensajeError.set('Error al eliminar la reserva');
      this.cargando.set(false);
      this.mostrandoConfirmacionEliminar.set(false);
    });
  }

  eliminarReserva() {
    this.eliminarReservaConfirmada();
  }

  cancelarEdicion() {
    this.reservaEditando.set(false);
    this.mensajeError.set('');
    this.cargarReservaReciente();
  }

  irAMisReservas() {
    localStorage.removeItem('reservaReciente');
    this.router.navigate(['/mis-reservas']);
  }
}
