import { useState, useEffect, useCallback, useRef } from "react";
import {
  createIncident,
  getAllIncidents,
  createIncidentWebSocket,
} from "./api";

export function useIncidents(accessToken) {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalCounts, setTotalCounts] = useState({
    power_cut: 0,
    traffic_jam: 0,
    safety_issue: 0,
    other: 0,
  });
  const wsRef = useRef(null);

  const updateTotalCounts = useCallback((incidentList) => {
    const today = new Date().toDateString();
    const todayIncidents = incidentList.filter(
      (incident) => new Date(incident.reportedAt).toDateString() === today,
    );
    setTotalCounts({
      power_cut: todayIncidents.filter((i) => i.incidentType === "power_cut")
        .length,
      traffic_jam: todayIncidents.filter(
        (i) => i.incidentType === "traffic_jam",
      ).length,
      safety_issue: todayIncidents.filter(
        (i) => i.incidentType === "safety_issue",
      ).length,
      other: todayIncidents.filter((i) => i.incidentType === "other").length,
    });
  }, []);

  const fetchIncidents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getAllIncidents(accessToken);
      if (response.success) {
        setIncidents(response.data || []);
        updateTotalCounts(response.data || []);
      } else {
        setError(response.message || "Failed to fetch incidents");
      }
    } catch (err) {
      console.warn("Failed to fetch incidents:", err.message);
      setError(err.message || "Failed to fetch incidents");
      setIncidents([]);
    } finally {
      setLoading(false);
    }
  }, [accessToken, updateTotalCounts]);

  const createNewIncident = useCallback(
    async (incidentData) => {
      try {
        setError(null);
        const response = await createIncident(incidentData, accessToken);
        if (response.success) {
          return { success: true, data: response.data };
        } else {
          setError(response.message || "Failed to create incident");
          return { success: false, error: response.message };
        }
      } catch (err) {
        setError(err.message || "Failed to create incident");
        return { success: false, error: err.message };
      }
    },
    [accessToken],
  );

  const connectWebSocket = useCallback(() => {
    if (
      wsRef.current?.readyState === WebSocket.OPEN ||
      wsRef.current?.readyState === WebSocket.CONNECTING
    )
      return;

    try {
      const ws = createIncidentWebSocket();
      wsRef.current = ws;

      ws.onopen = () => console.log("WebSocket connected for incidents");
      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type === "new_incident") {
            setIncidents((prev) => [message.data, ...prev]);
          }
        } catch (err) {
          console.error("Error parsing WebSocket message:", err);
        }
      };
      ws.onerror = (error) => console.warn("WebSocket error:", error);
      ws.onclose = () => {
        console.log("WebSocket disconnected");
        wsRef.current = null;
        setTimeout(() => {
          if (!wsRef.current) connectWebSocket();
        }, 5000);
      };
    } catch (err) {
      console.warn("Failed to connect WebSocket:", err);
    }
  }, []);

  useEffect(() => {
    fetchIncidents();
    connectWebSocket();
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [fetchIncidents, connectWebSocket]);

  useEffect(() => {
    updateTotalCounts(incidents);
  }, [incidents, updateTotalCounts]);

  return {
    incidents,
    loading,
    error,
    totalCounts,
    createNewIncident,
    fetchIncidents,
  };
}
