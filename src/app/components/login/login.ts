import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import {
  UsuariosService
} from '../../services/usuarios';

@Component({
  selector: 'app-login',
  imports: [RouterLink, FormsModule, CommonModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {

  correo = '';
  password = '';

  mensajeError = '';

  constructor(
    private usuariosService: UsuariosService,
    private router: Router
  ) {}

  iniciarSesion() {

    // VALIDAR CAMPOS VACIOS
    if (!this.correo || !this.password) {

      this.mensajeError = 'Todos los campos son obligatorios';
      return;
    }

    this.usuariosService
      .validarUsuario(this.correo, this.password)
      .subscribe((usuarios) => {

        if (usuarios.length > 0) {
          localStorage.setItem('usuarioLogueado', JSON.stringify(usuarios[0]));
          this.router.navigate(['/home']);    
          this.mensajeError = '';

          this.router.navigate(['/home']);

        } else {

          this.mensajeError =
            'Correo o contraseña incorrectos';
        }

      });

  }
}