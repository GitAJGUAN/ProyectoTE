import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ReservasService, Reserva } from '../../services/reservas';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-mis-reservas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './misReservas.html',
  styleUrl: './misReservas.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MisReservas implements OnInit, OnDestroy {
  reservas = signal<Reserva[]>([]);
  cargando = signal(true);
  mensaje = signal('');
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
    this.reservasService.obtenerReservasPorUsuario(usuarioId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (datos) => {
          console.log('Mis reservas cargadas para usuario:', usuarioId, datos);
          this.reservas.set(datos);
          this.cargando.set(false);
        },
        error: (error) => {
          console.error('Error al cargar reservas:', error);
          this.cargando.set(false);
        }
      });
  }

  volverAtras() {
    this.router.navigate(['/home']);
  }

  hacerOtraReserva() {
    this.router.navigate(['/dashboard']);
  }
}
