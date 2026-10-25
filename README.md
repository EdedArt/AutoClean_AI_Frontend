# AutoClean AI - Frontend Móvil

Aplicación móvil desarrollada con **Expo (React Native)**, **TypeScript** y **Expo Router** para el sistema de autolavado AutoClean AI (proyecto universitario).

---

## 📋 Requisitos Previos

- **Node.js** (v20 o superior recomendado, v24 soportado)
- **npm** (v10 o superior)
- Dispositivo móvil con la aplicación **Expo Go** instalada (o emulador Android / simulador iOS)
- Computadora y dispositivo móvil conectados a la **misma red Wi-Fi**

---

## 🚀 Instalación

1. Clona el repositorio e ingresa al directorio del proyecto:
   ```bash
   cd Frontend
   ```

2. Instala las dependencias:
   ```bash
   npm install
   ```

---

## ⚙️ Configuración de Variables de Entorno

Para que la aplicación móvil pueda comunicarse con el backend, debes configurar la IP local de tu computador:

1. Copia la plantilla de entorno:
   ```bash
   copy .env.example .env
   ```

2. Averigua tu IP local en Windows ejecutando:
   ```cmd
   ipconfig
   ```
   Ubica la dirección IPv4 de tu adaptador de red (ejemplo: `192.168.1.15`).

3. Edita `.env` y define la URL del backend (no uses `localhost` si pruebas en un dispositivo físico):
   ```env
   EXPO_PUBLIC_API_URL=http://192.168.1.15:3000
   ```

> ⚠️ **Nota sobre el Firewall de Windows (Puerto 3000):**  
> Si pruebas desde un teléfono celular físico, asegúrate de permitir las conexiones entrantes al puerto 3000 y a Node.js en el Firewall de Windows (en redes privadas/domésticas). De lo contrario, el dispositivo móvil no podrá alcanzar el backend.

---

## 📱 Ejecución del Proyecto

1. **Asegúrate de que el Backend esté corriendo:**
   El backend de Node/Express debe estar activo y respondiendo en el puerto 3000 (puedes verificar en el navegador: `http://localhost:3000/api/health`).

2. **Inicia el servidor de desarrollo de Expo:**
   ```bash
   npx expo start
   ```

3. **Abrir en Expo Go:**
   - **Android:** Abre la app Expo Go y escanea el código QR mostrado en la terminal.
   - **iOS:** Abre la app Cámara, apunta al código QR y presiona la notificación para abrir en Expo Go.

---

## 🛠️ Scripts Disponibles

- `npm run lint` - Ejecuta la verificación de código con ESLint.
- `npm run format` - Da formato al código usando Prettier.
- `npm run typecheck` - Valida los tipos de TypeScript sin emitir archivos.
