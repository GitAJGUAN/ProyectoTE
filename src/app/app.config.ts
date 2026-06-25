import { ApplicationConfig, provideBrowserGlobalErrorListeners, isDevMode } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { provideServiceWorker } from '@angular/service-worker';

export const appConfig: ApplicationConfig = {
  providers: [
    provideFirebaseApp(() => 
      initializeApp({ 
        apiKey: "AIzaSyAezzk_wdJw4tRLbVisDklKwhMAPrNwNHg",
        authDomain: "proyectote-2b4bf.firebaseapp.com",
        projectId: "proyectote-2b4bf",
        storageBucket: "proyectote-2b4bf.firebasestorage.app",
        messagingSenderId: "249515909182",
        appId: "1:249515909182:web:ed09c90df3488d1abeb16f",
        measurementId: "G-9M9RVS79JL"
    })),
    provideFirestore(() => getFirestore()),
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes), provideServiceWorker('ngsw-worker.js', {
            enabled: !isDevMode(),
            registrationStrategy: 'registerWhenStable:30000'
          })
  ]
};
