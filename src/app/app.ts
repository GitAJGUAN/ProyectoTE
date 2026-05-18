import { Component, signal } from '@angular/core';
import { Router, RouterOutlet, RouterLink, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('proyecto-clase');
  protected readonly nombreUsuario = signal<string>('');
  protected readonly numeroCuenta = signal<number | null>(null);

  menuAbierto = false;

  constructor(private router: Router) {
    this.obtenerNombreUsuario();

    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.obtenerNombreUsuario();
      });
  }

  estaLogueado(): boolean {
    return localStorage.getItem('usuarioLogueado') !== null;
  }

  obtenerNombreUsuario(): void {
    const usuarioGuardado = localStorage.getItem('usuarioLogueado');

    if (usuarioGuardado) {
      const usuario = JSON.parse(usuarioGuardado);

      this.nombreUsuario.set(usuario.nombre || usuario.correo || '');
      this.numeroCuenta.set(usuario.numeroCuenta || null);
    } else {
      this.nombreUsuario.set('');
      this.numeroCuenta.set(null);
    }
  }

  abrirMenu() {
    this.menuAbierto = true;
  }

  cerrarMenu() {
    this.menuAbierto = false;
  }

  cerrarSesion() {
    localStorage.removeItem('usuarioLogueado');
    this.nombreUsuario.set('');
    this.numeroCuenta.set(null);
    this.menuAbierto = false;
    this.router.navigate(['/login']);
  }
}