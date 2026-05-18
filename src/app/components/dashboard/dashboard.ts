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

  fechaMinima = new Date().toISOString().split('T')[0];

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

  validarReserva(): boolean {
    this.mensaje.set('');

    if (
      !this.reserva.espacio ||
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

    if (this.reserva.hora < '07:00' || this.reserva.hora > '21:00') {
      this.mensaje.set('La hora debe estar entre 7:00 AM y 9:00 PM');
      return false;
    }

    if (this.reserva.duracion < 1) {
      this.mensaje.set('La duración debe ser mínimo de 1 hora');
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