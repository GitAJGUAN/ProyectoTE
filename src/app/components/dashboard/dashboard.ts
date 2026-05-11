import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import {
  ReservasService,
  Reserva
} from '../../services/reservas';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss']
})
export class DashboardComponent {

  // Objeto del formulario
  reserva: Reserva = {
    espacio: '',
    fecha: '',
    hora: '',
    duracion: 1
  };

  // Lista de reservas
  reservas: Reserva[] = [];

  // Mensaje de éxito o error
  mensaje = '';

  constructor(private reservasService: ReservasService) {
    // Se carga una sola vez. Firestore actualizará la lista automáticamente.
    this.cargarReservas();
  }

  // =========================
  // CREATE - Guardar reserva
  // =========================
  guardarReserva() {

    // Validar campos vacíos
    if (
      !this.reserva.espacio ||
      !this.reserva.fecha ||
      !this.reserva.hora ||
      !this.reserva.duracion
    ) {
      this.mensaje = 'Todos los campos son obligatorios';
      return;
    }

    this.reservasService.agregarReserva(this.reserva)
      .then(() => {

        // Mensaje de éxito
        this.mensaje = 'Reserva guardada correctamente';

        // Limpiar formulario
        this.reserva = {
          espacio: '',
          fecha: '',
          hora: '',
          duracion: 1
        };

        // No es necesario llamar cargarReservas() otra vez,
        // porque collectionData() actualiza automáticamente.
      })
      .catch((error) => {
        console.error(error);
        this.mensaje = 'Error al guardar la reserva';
      });
  }

  // =========================
  // READ - Obtener reservas
  // =========================
  cargarReservas() {
    this.reservasService.obtenerReservas()
      .subscribe((datos) => {
        // Crear un nuevo arreglo para forzar la actualización de la vista
        this.reservas = [...datos];
      });
  }

  // =========================
  // DELETE - Eliminar reserva
  // =========================
  eliminarReserva(id: string) {

    if (!confirm('¿Deseas eliminar esta reserva?')) {
      return;
    }

    this.reservasService.eliminarReserva(id)
      .then(() => {
        this.mensaje = 'Reserva eliminada correctamente';
        // Firestore actualizará la lista automáticamente
      })
      .catch((error) => {
        console.error(error);
        this.mensaje = 'Error al eliminar la reserva';
      });
  }

  // =========================
  // UPDATE - Editar reserva
  // =========================
  editarReserva(reserva: Reserva) {

    const nuevaDuracion = prompt(
      'Ingrese la nueva duración en horas:',
      reserva.duracion.toString()
    );

    // Si el usuario cancela
    if (nuevaDuracion === null) {
      return;
    }

    const duracionNumero = Number(nuevaDuracion);

    // Validar número
    if (isNaN(duracionNumero) || duracionNumero <= 0) {
      this.mensaje = 'Ingrese una duración válida';
      return;
    }

    if (reserva.id) {
      this.reservasService.actualizarReserva(reserva.id, {
        duracion: duracionNumero
      })
      .then(() => {
        this.mensaje = 'Reserva actualizada correctamente';
        // Firestore actualizará la lista automáticamente
      })
      .catch((error) => {
        console.error(error);
        this.mensaje = 'Error al actualizar la reserva';
      });
    }
  }
}