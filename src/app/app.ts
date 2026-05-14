import { Component, signal } from '@angular/core';
import { Router, RouterOutlet, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('proyecto-clase');

  menuAbierto = false;

  constructor(private router: Router) {}

  estaLogueado(): boolean {
    return localStorage.getItem('usuarioLogueado') !== null;
  }

  abrirMenu() {
    this.menuAbierto = true;
  }

  cerrarMenu() {
    this.menuAbierto = false;
  }

  cerrarSesion() {
    localStorage.removeItem('usuarioLogueado');
    this.menuAbierto = false;
    this.router.navigate(['/login']);
  }
}