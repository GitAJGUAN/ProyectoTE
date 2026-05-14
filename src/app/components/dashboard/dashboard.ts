import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ChangeDetectionStrategy } from '@angular/core';

import {
  ReservasService,
  Reserva
} from '../../services/reservas';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent {

  reserva: Reserva = {
    espacio: '',
    fecha: '',
    hora: '',
    duracion: 1
  };

  mensaje = signal('');
  cargando = signal(false);

  constructor(
    private reservasService: ReservasService,
    private router: Router
  ) {}

  guardarReserva() {
    if (
      !this.reserva.espacio ||
      !this.reserva.fecha ||
      !this.reserva.hora ||
      !this.reserva.duracion
    ) {
      this.mensaje.set('Todos los campos son obligatorios');
      return;
    }

    // Obtener usuario del localStorage
    const usuarioLogueado = localStorage.getItem('usuarioLogueado');
    if (usuarioLogueado) {
      const usuario = JSON.parse(usuarioLogueado);
      this.reserva.usuarioId = usuario.id;
    }

    this.cargando.set(true);
    
    console.log('Guardando reserva:', this.reserva);
    
    this.reservasService.agregarReserva(this.reserva)
      .then((docRef) => {
        console.log('Reserva guardada exitosamente con ID:', docRef.id);
        this.mensaje.set('Reserva guardada correctamente');
        // Esperar un bit antes de navegar para asegurar que Firestore lo procese
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