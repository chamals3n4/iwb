import { getAuthHeaders } from "@/lib/api";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
const WS_BASE_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:9091";

export async function createIncident(incidentData) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/incidents`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(session),
      },
      body: JSON.stringify(incidentData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error creating incident:", error);
    throw error;
  }
}

export async function getAllIncidents() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/incidents`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(session),
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching incidents:", error);
    throw error;
  }
}

export async function getIncidentById(incidentId) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/incidents/${incidentId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(session),
        },
      },
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching incident:", error);
    throw error;
  }
}

export async function updateUserLocation(userId, location) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/users/${userId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(session),
      },
      body: JSON.stringify(location),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error updating user location:", error);
    throw error;
  }
}

export function createIncidentWebSocket() {
  return new WebSocket(`${WS_BASE_URL}/incidents`);
}
