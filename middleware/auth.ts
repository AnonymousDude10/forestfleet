export default defineNuxtRouteMiddleware(async (to) => {
  if (import.meta.client) {
    const token = localStorage.getItem("foresttoken");

    const isAuthenticated = !!token;
    const publicRoutes = ["/"];
    const isPublicRoute = publicRoutes.includes(to.path);

    if (!isAuthenticated && !isPublicRoute) {
      return navigateTo("/");
    }

    if (token) {
      const user = await fetch("/api/auth/me", {
        method: "GET",
        headers: {
          Authorization: `${token}`,
          "Content-Type": "application/json",
        },
      })
        .then((res) => res.json())
        .catch((err) => {
          console.error("Error fetching user data:", err);
          return null;
        });

      if (!user) {
        return navigateTo("/login");
      }
    }
  }
});
