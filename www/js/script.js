// js/welcome.js

// Función para autenticarse
// function authenticate(event) {
//   event.preventDefault();

//   var password = document.getElementById('password').value;

//   // Verificar las credenciales
//   if (password === 'Bodorrio2025') {
//       // Credenciales válidas, mostrar el contenido
//       document.getElementById('login-container').style.display = 'none';
//       document.getElementById('content-container').style.display = 'block';
//       // Almacenar en sessionStorage que el usuario ha iniciado sesión
//       sessionStorage.setItem('isLoggedIn', 'true');
//   } else {
//       // Credenciales incorrectas, mostrar un mensaje de error
//       alert('Credenciales incorrectas. Por favor, inténtalo de nuevo.');
//   }
// }

// Evento "load" inicial
/*
window.addEventListener("load", function () {
  // Comprobar si el usuario ya está autenticado
  var isLoggedIn = sessionStorage.getItem('isLoggedIn');

  if (isLoggedIn === 'true') {
      // El usuario ha iniciado sesión previamente
      ocultarContenedorDeInicioDeSesion();
      mostrarContenido(); // Mostrar el contenido directamente
  }

  // Agregar el event listener al formulario de inicio de sesión *aquí*, después de que el DOM esté cargado
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
      loginForm.addEventListener('submit', authenticate);
  }
});

// Función para ocultar el contenedor de inicio de sesión
function ocultarContenedorDeInicioDeSesion() {
  var loginContainer = document.getElementById('login-container');
  if (loginContainer) {
      loginContainer.style.display = 'none';
  }
}

// Función para mostrar el contenedor de contenido
function mostrarContenido() {
  var contentContainer = document.getElementById('content-container');
  if (contentContainer) {
      contentContainer.style.display = 'block';
  }
}*/