import { Injectable, inject } from '@angular/core';

import {
  Firestore,
  collection,
  addDoc,
  collectionData,
  query,
  where
} from '@angular/fire/firestore';

import { Observable } from 'rxjs';

export interface Usuario {
  id?: string;
  nombre: string;
  correo: string;
  numeroCuenta: number;
  password: string;
}

@Injectable({
  providedIn: 'root'
})
export class UsuariosService {

  private firestore = inject(Firestore);

  private usuariosCollection = collection(this.firestore, 'usuarios');

  // CREATE
  agregarUsuario(usuario: Usuario) {
    return addDoc(this.usuariosCollection, usuario);
  }

  // READ
  obtenerUsuarios(): Observable<Usuario[]> {
    return collectionData(this.usuariosCollection, {
      idField: 'id'
    }) as Observable<Usuario[]>;
  }

  // LOGIN
  validarUsuario(correo: string, password: string) {

    const consulta = query(
      this.usuariosCollection,
      where('correo', '==', correo),
      where('password', '==', password)
    );

    return collectionData(consulta, {
      idField: 'id'
    }) as Observable<Usuario[]>;
  }
}