export function api() {
  const fetchVehicles = async () => {
    try {
      const response = await fetch(`/api/vehicles`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("foresttoken")}`,
          "Content-Type": "application/json",
        },
      });
      return await response.json();
    } catch (error) {
      console.error("Error fetching vehicles:", error);
      throw error;
    }
  };

  return {
    fetchVehicles,
  };
}
