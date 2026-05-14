import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ReservasService, Reserva } from '../../services/reservas';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-hoja-confirmacion',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './hojaConfirmacion.html',
  styleUrl: './hojaConfirmacion.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HojaConfirmacion implements OnInit, OnDestroy {
  reservas = signal<Reserva[]>([]);
  mensaje = signal('');
  reservaEditando = signal<Reserva | null>(null);
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

    this.reservasService.obtenerReservasPorUsuario(usuarioId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (datos) => {
          console.log('Reservas del usuario cargadas:', datos);
          this.reservas.set(datos);
        },
        error: (error) => {
          console.error('Error al cargar reservas:', error);
          this.mensaje.set('Error al cargar las reservas');
        }
      });
  }

  editarReserva(reserva: Reserva) {
    this.reservaEditando.set({ ...reserva });
  }

  guardarEdicion() {
    if (!this.reservaEditando()?.id) return;

    const reservaActual = this.reservaEditando();
    if (!reservaActual) return;

    this.reservasService.actualizarReserva(reservaActual.id!, {
      espacio: reservaActual.espacio,
      fecha: reservaActual.fecha,
      hora: reservaActual.hora,
      duracion: reservaActual.duracion
    }).then(() => {
      this.mensaje.set('Reserva actualizada correctamente');
      this.reservaEditando.set(null);
      // Recargar las reservas
      this.cargarReservas();
    });
  }

  eliminarReserva(id: string) {
    this.reservasService.eliminarReserva(id).then(() => {
      this.mensaje.set('Reserva eliminada correctamente');
      // Recargar las reservas
      this.cargarReservas();
    });
  }

  cancelarEdicion() {
    this.reservaEditando.set(null);
  }

  confirmarReservaciones() {
    this.router.navigate(['/mis-reservas']);
  }
}
