// Função utilitária para fazer logout e redirecionar para login
export function fazerLogout() {
  localStorage.removeItem("token");
  localStorage.removeItem("contaCriada");
  localStorage.removeItem("novoUsuarioNome");
  window.location.href = "/";
}
