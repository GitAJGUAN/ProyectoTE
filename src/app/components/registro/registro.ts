import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

import {
  UsuariosService,
  Usuario
} from '../../services/usuarios';

@Component({
  selector: 'app-registro',
  imports: [RouterLink, FormsModule],
  templateUrl: './registro.html',
  styleUrl: './registro.scss',
})
export class Registro {

  constructor(private usuariosService: UsuariosService) {}

  usuario: Usuario = {
    nombre: '',
    correo: '',
    numeroCuenta: 0,
    password: ''
  };

  registrarUsuario() {

    this.usuariosService.agregarUsuario(this.usuario)
      .then(() => {

        alert('Usuario registrado correctamente');

        this.usuario = {
          nombre: '',
          correo: '',
          numeroCuenta: 0,
          password: ''
        };

      })
      .catch((error) => {

        console.log(error);

        alert('Ocurrió un error');

      });
  }
}