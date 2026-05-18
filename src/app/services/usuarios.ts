import { Injectable, inject } from '@angular/core';

import {
  Firestore,
  collection,
  addDoc,
  collectionData,
  query,
  where,
  getDocs
} from '@angular/fire/firestore';

import { Observable } from 'rxjs';

export interface Usuario {
  id?: string;
  primerNombre: string;
  segundoNombre: string;
  primerApellido: string;
  segundoApellido: string;
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

  agregarUsuario(usuario: Usuario) {
    return addDoc(this.usuariosCollection, usuario);
  }

  obtenerUsuarios(): Observable<Usuario[]> {
    return collectionData(this.usuariosCollection, {
      idField: 'id'
    }) as Observable<Usuario[]>;
  }

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

  async existeNumeroCuenta(numeroCuenta: number): Promise<boolean> {
    const consulta = query(
      this.usuariosCollection,
      where('numeroCuenta', '==', numeroCuenta)
    );

    const resultado = await getDocs(consulta);
    return !resultado.empty;
  }
}