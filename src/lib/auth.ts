export function fazerLogout() {
  localStorage.removeItem("token");
  localStorage.removeItem("contaCriada");
  localStorage.removeItem("novoUsuarioNome");
  window.location.href = "/";
}

export function usuarioAutenticado(): boolean {
  try {
    const token = localStorage.getItem("token");
    if (!token) return false;

    const payload = JSON.parse(atob(token.split('.')[1]));
    const exp = payload.exp as number | undefined;

    if (exp && Date.now() >= exp * 1000) {
      localStorage.removeItem("token");
      return false;
    }

    return true;
  } catch {
    localStorage.removeItem("token");
    return false;
  }
}
