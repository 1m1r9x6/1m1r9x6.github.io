
  
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js').then(() => {
      console.log("Service Worker зарегистрирован");
    }).catch((error) => {
      console.log("Ошибка при регистрации Service Worker:", error);
    });
}