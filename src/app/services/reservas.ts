import { Injectable, inject } from '@angular/core';

import {
  Firestore,
  collection,
  addDoc,
  collectionData,
  doc,
  updateDoc,
  deleteDoc
} from '@angular/fire/firestore';

import { Observable } from 'rxjs';

export interface Reserva {
  id?: string;
  espacio: string;
  fecha: string;
  hora: string;
  duracion: number;
}

@Injectable({
  providedIn: 'root'
})
export class ReservasService {

  private firestore = inject(Firestore);

  private reservasCollection = collection(
    this.firestore,
    'reservas'
  );

  // CREATE
  agregarReserva(reserva: Reserva) {
    return addDoc(this.reservasCollection, reserva);
  }

  // READ
  obtenerReservas(): Observable<Reserva[]> {
    return collectionData(this.reservasCollection, {
      idField: 'id'
    }) as Observable<Reserva[]>;
  }

  // UPDATE
  actualizarReserva(id: string, datos: Partial<Reserva>) {
    const documento = doc(this.firestore, `reservas/${id}`);
    return updateDoc(documento, datos);
  }

  // DELETE
  eliminarReserva(id: string) {
    const documento = doc(this.firestore, `reservas/${id}`);
    return deleteDoc(documento);
  }
}