import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ReservasService, Reserva } from '../../services/reservas';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

interface ReservaDetallada extends Reserva {
  horaFin: string;
  solicitante: string;
  numeroCuenta: number | string;
}

@Component({
  selector: 'app-mis-reservas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './misReservas.html',
  styleUrl: './misReservas.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MisReservas implements OnInit, OnDestroy {
  reservas = signal<ReservaDetallada[]>([]);
  cargando = signal(true);
  mensaje = signal('');
  error = signal('');
  eliminandoId = signal<string | null>(null);
  reservaParaEliminar = signal<ReservaDetallada | null>(null);
  private destroy$ = new Subject<void>();

  constructor(
    private reservasService: ReservasService,
    private router: Router
  ) {}

  ngOnInit() {
    this.cargarReservas();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  cargarReservas() {
    // Obtener el usuario logueado del localStorage
    const usuarioLogueado = localStorage.getItem('usuarioLogueado');
    
    if (!usuarioLogueado) {
      this.router.navigate(['/login']);
      return;
    }

    const usuario = JSON.parse(usuarioLogueado);
    const usuarioId = usuario.id;

    this.cargando.set(true);
    this.error.set('');
    this.reservasService.obtenerReservasPorUsuario(usuarioId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (datos) => {
          console.log('Mis reservas cargadas para usuario:', usuarioId, datos);
          this.reservas.set(
            datos.map((reserva) => ({
              ...reserva,
              horaFin: this.calcularHoraFin(reserva.hora, reserva.duracion),
              solicitante: usuario.nombre,
              numeroCuenta: usuario.numeroCuenta
            }))
          );
          this.cargando.set(false);
        },
        error: (error) => {
          console.error('Error al cargar reservas:', error);
          this.error.set('No se pudieron cargar tus reservas.');
          this.cargando.set(false);
        }
      });
  }

  abrirConfirmacionEliminar(reserva: ReservaDetallada) {
    if (this.eliminandoId()) {
      return;
    }

    this.mensaje.set('');
    this.error.set('');
    this.reservaParaEliminar.set(reserva);
  }

  cerrarConfirmacionEliminar() {
    if (this.eliminandoId()) {
      return;
    }

    this.reservaParaEliminar.set(null);
  }

  eliminarReservaConfirmada() {
    const reserva = this.reservaParaEliminar();
    if (!reserva?.id || this.eliminandoId()) {
      return;
    }

    this.mensaje.set('');
    this.error.set('');
    this.eliminandoId.set(reserva.id);

    this.reservasService.eliminarReserva(reserva.id)
      .then(() => {
        this.reservas.update((reservas) =>
          reservas.filter((actual) => actual.id !== reserva.id)
        );

        const reservaReciente = localStorage.getItem('reservaReciente');
        if (reservaReciente) {
          const reservaGuardada = JSON.parse(reservaReciente);
          if (reservaGuardada.id === reserva.id) {
            localStorage.removeItem('reservaReciente');
          }
        }

        this.mensaje.set('Reserva eliminada. Ese horario vuelve a estar disponible.');
        this.reservaParaEliminar.set(null);
      })
      .catch((error) => {
        console.error('Error al eliminar reserva:', error);
        this.error.set('No se pudo eliminar la reserva. Intenta de nuevo.');
      })
      .finally(() => {
        this.eliminandoId.set(null);
      });
  }

  eliminarReserva(reserva: Reserva) {
    if (!reserva.id || this.eliminandoId()) {
      return;
    }


    this.mensaje.set('');
    this.error.set('');
    this.eliminandoId.set(reserva.id);

    this.reservasService.eliminarReserva(reserva.id)
      .then(() => {
        this.reservas.update((reservas) =>
          reservas.filter((actual) => actual.id !== reserva.id)
        );

        const reservaReciente = localStorage.getItem('reservaReciente');
        if (reservaReciente) {
          const reservaGuardada = JSON.parse(reservaReciente);
          if (reservaGuardada.id === reserva.id) {
            localStorage.removeItem('reservaReciente');
          }
        }

        this.mensaje.set('Reserva eliminada. Ese horario vuelve a estar disponible.');
      })
      .catch((error) => {
        console.error('Error al eliminar reserva:', error);
        this.error.set('No se pudo eliminar la reserva. Intenta de nuevo.');
      })
      .finally(() => {
        this.eliminandoId.set(null);
      });
  }

  private calcularHoraFin(hora: string, duracion: number): string {
    const [h, m] = hora.split(':').map(Number);
    const totalMinutos = h * 60 + m + (duracion * 60);
    const horas = Math.floor(totalMinutos / 60);
    const minutos = totalMinutos % 60;
    return `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}`;
  }

  volverAtras() {
    this.router.navigate(['/home']);
  }

  hacerOtraReserva() {
    this.router.navigate(['/dashboard']);
  }
}
