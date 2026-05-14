import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () => import('./components/login/login').then(m => m.Login)
  },
  {
    path: 'registro',
    loadComponent: () => import('./components/registro/registro').then(m => m.Registro)
  },
  {
    path: 'home',
    loadComponent: () => import('./components/home/home').then(m => m.Home)
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./components/dashboard/dashboard').then(m => m.DashboardComponent)
  },
  {
    path: 'hoja-confirmacion',
    loadComponent: () =>
      import('./components/hojaConfirmacion/hojaConfirmacion')
        .then(m => m.HojaConfirmacion)
  },
  {
    path: 'mis-reservas',
    loadComponent: () =>
      import('./components/misReservas/misReservas')
        .then(m => m.MisReservas)
  }
];