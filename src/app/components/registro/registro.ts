import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import {
  UsuariosService,
  Usuario
} from '../../services/usuarios';

@Component({
  selector: 'app-registro',
  imports: [RouterLink, FormsModule, CommonModule],
  templateUrl: './registro.html',
  styleUrl: './registro.scss',
})
export class Registro {

  constructor(private usuariosService: UsuariosService) {}

  mensajeExito = '';

  errores = {
    primerNombre: '',
    segundoNombre: '',
    primerApellido: '',
    segundoApellido: '',
    correo: '',
    numeroCuenta: '',
    password: ''
  };

  usuario: Usuario = {
    primerNombre: '',
    segundoNombre: '',
    primerApellido: '',
    segundoApellido: '',
    nombre: '',
    correo: '',
    numeroCuenta: 0,
    password: ''
  };

  limpiarError(campo: keyof typeof this.errores) {
    this.errores[campo] = '';
    this.mensajeExito = '';
  }

  validarCampos(): boolean {
    let valido = true;

    this.errores = {
      primerNombre: '',
      segundoNombre: '',
      primerApellido: '',
      segundoApellido: '',
      correo: '',
      numeroCuenta: '',
      password: ''
    };

    const regexNombre = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;
    const regexCorreo = /^[a-zA-Z0-9._%+-]+@(unitec\.edu|ceutec\.hn)$/;
    const regexCuenta = /^[0-9]{8}$/;

    if (!this.usuario.primerNombre || !regexNombre.test(this.usuario.primerNombre)) {
      this.errores.primerNombre = 'Ingrese un primer nombre válido';
      valido = false;
    }

    if (this.usuario.segundoNombre && !regexNombre.test(this.usuario.segundoNombre)) {
      this.errores.segundoNombre = 'Ingrese un segundo nombre válido';
      valido = false;
    }

    if (!this.usuario.primerApellido || !regexNombre.test(this.usuario.primerApellido)) {
      this.errores.primerApellido = 'Ingrese un primer apellido válido';
      valido = false;
    }

    if (this.usuario.segundoApellido && !regexNombre.test(this.usuario.segundoApellido)) {
      this.errores.segundoApellido = 'Ingrese un segundo apellido válido';
      valido = false;
    }

    if (!this.usuario.correo || !regexCorreo.test(this.usuario.correo)) {
      this.errores.correo = 'Use un correo institucional válido';
      valido = false;
    }

    if (!this.usuario.numeroCuenta || !regexCuenta.test(String(this.usuario.numeroCuenta))) {
      this.errores.numeroCuenta = 'Debe contener exactamente 8 dígitos';
      valido = false;
    }

    if (!this.usuario.password || this.usuario.password.length < 6) {
      this.errores.password = 'La contraseña debe tener mínimo 6 caracteres';
      valido = false;
    }

    return valido;
  }

  registrarUsuario() {
    this.mensajeExito = '';

    if (!this.validarCampos()) {
      return;
    }

    this.usuario.nombre =
      `${this.usuario.primerNombre} ${this.usuario.segundoNombre} ${this.usuario.primerApellido} ${this.usuario.segundoApellido}`
        .replace(/\s+/g, ' ')
        .trim();

    this.usuariosService.agregarUsuario({
      ...this.usuario,
      numeroCuenta: Number(this.usuario.numeroCuenta)
    });

    this.mensajeExito = 'Cuenta creada correctamente. Ahora puedes iniciar sesión.';

    this.usuario = {
      primerNombre: '',
      segundoNombre: '',
      primerApellido: '',
      segundoApellido: '',
      nombre: '',
      correo: '',
      numeroCuenta: 0,
      password: ''
    };
  }
}