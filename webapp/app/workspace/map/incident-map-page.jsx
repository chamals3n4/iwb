"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, X, Loader2 } from "lucide-react";
import { useIncidents } from "./use-incidents";

function decodeJWT(token) {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return null;
  }
}

function loadGoogleMaps() {
  if (window.google?.maps) return Promise.resolve(window.google);
  const existing = document.querySelector(
    'script[data-google-maps-loader="true"],script[data-google-maps-places-loader="true"],script[src*="maps.googleapis.com/maps/api/js"]',
  );
  if (existing) {
    return new Promise((resolve, reject) => {
      if (window.google?.maps) return resolve(window.google);
      existing.addEventListener("load", () => resolve(window.google));
      existing.addEventListener("error", reject);
    });
  }

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    console.error("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not set");
    return Promise.reject(new Error("Missing Google Maps API key"));
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.setAttribute("data-google-maps-loader", "true");
    script.onload = () => resolve(window.google);
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

export default function IncidentMapPage({ accessToken }) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const infoWindowRef = useRef(null);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const markersRef = useRef({});

  const claims = accessToken ? decodeJWT(accessToken) : null;
  const { incidents, loading, error, totalCounts, createNewIncident } =
    useIncidents(accessToken);

  const [formData, setFormData] = useState({
    type: "",
    description: "",
    latitude: "",
    longitude: "",
  });

  useEffect(() => {
    if (map.current) return;
    if (!mapContainer.current) return;

    let isMounted = true;
    loadGoogleMaps()
      .then((google) => {
        if (!isMounted) return;
        map.current = new google.maps.Map(mapContainer.current, {
          center: { lat: 6.9271, lng: 79.8612 },
          zoom: 12,
          disableDoubleClickZoom: true,
          fullscreenControl: true,
          zoomControl: true,
          mapTypeControl: false,
        });
        infoWindowRef.current = new google.maps.InfoWindow();

        map.current.addListener("dblclick", (e) => {
          if (isDialogOpen) return;
          const lat = e.latLng.lat();
          const lng = e.latLng.lng();
          setFormData((prev) => ({
            ...prev,
            latitude: lat.toFixed(8),
            longitude: lng.toFixed(8),
          }));
          setIsDialogOpen(true);
        });
      })
      .catch((err) => console.error("Failed to load Google Maps:", err));

    return () => {
      isMounted = false;
      map.current = null;
      infoWindowRef.current = null;
    };
  }, []);

  const addIncidentMarkers = useCallback(() => {
    if (!map.current) return;
    Object.values(markersRef.current).forEach((marker) => {
      if (marker?.setMap) marker.setMap(null);
    });
    markersRef.current = {};

    incidents.forEach((incident) => {
      const google = window.google;
      const position = { lat: incident.latitude, lng: incident.longitude };
      const iconSvg =
        "data:image/svg+xml;charset=UTF-8," +
        encodeURIComponent(
          '<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 24 24" fill="red"><path d="M18.364 4.636a9 9 0 0 1 .203 12.519l-.203 .21l-4.243 4.242a3 3 0 0 1 -4.097 .135l-.144 -.135l-4.244 -4.243a9 9 0 0 1 12.728 -12.728zm-6.364 3.364a3 3 0 1 0 0 6a3 3 0 0 0 0 -6z"/></svg>',
        );

      const marker = new google.maps.Marker({
        position,
        map: map.current,
        icon: { url: iconSvg, scaledSize: new google.maps.Size(40, 40) },
      });

      markersRef.current[incident.incidentId] = marker;

      marker.addListener("click", () => {
        setSelectedIncident(incident);
        if (!infoWindowRef.current) return;
        const content = `<div style="max-width: 280px"><div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px"><div style="display:flex;align-items:center;gap:6px"><span style="display:inline-block;width:14px;height:14px;background:#ef4444;border-radius:50%"></span><strong style="font-size:13px">Incident #${incident.incidentId}</strong></div></div><div style="font-size:12px;color:#374151;margin-bottom:6px">${incident.incidentType}</div><div style="font-size:12px;color:#6b7280;margin-bottom:6px">${incident.description || ""}</div><div style="font-size:11px;color:#6b7280">${new Date(incident.reportedAt).toLocaleDateString()} at ${new Date(incident.reportedAt).toLocaleTimeString()}</div></div>`;
        infoWindowRef.current.setContent(content);
        infoWindowRef.current.open({ anchor: marker, map: map.current });
      });
    });
  }, [incidents]);

  useEffect(() => {
    if (map.current) addIncidentMarkers();
  }, [incidents, addIncidentMarkers]);

  useEffect(() => {
    if (!mapContainer.current || !map.current) return;
    const resize = () => {
      try {
        if (window.google?.maps && map.current)
          window.google.maps.event.trigger(map.current, "resize");
      } catch (_) {}
    };
    window.addEventListener("resize", resize);
    const ro = new ResizeObserver(resize);
    ro.observe(mapContainer.current);
    return () => {
      window.removeEventListener("resize", resize);
      ro.disconnect();
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const lat = Number(formData.latitude);
      const lng = Number(formData.longitude);
      if (isNaN(lat) || isNaN(lng)) {
        console.error("Invalid coordinates");
        return;
      }

      const incidentData = {
        userId: claims?.sub || "3f0c31a8-50a1-4c2a-9f3c-f1d19698b895",
        type: formData.type,
        description: formData.description,
        latitude: lat,
        longitude: lng,
      };

      const result = await createNewIncident(incidentData);

      if (result.success) {
        setFormData({ type: "", description: "", latitude: "", longitude: "" });
        setTimeout(() => setIsDialogOpen(false), 100);
      } else {
        console.error("Failed to create incident:", result.error);
      }
    } catch (error) {
      console.error("Error creating incident:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const showLoadingOverlay = loading && incidents.length === 0;

  return (
    <div className="flex h-full gap-4 p-4">
      <div className="flex-1 relative">
        <div ref={mapContainer} className="w-full h-full rounded-lg" />
        {showLoadingOverlay && (
          <div className="absolute inset-0 bg-background/75 flex items-center justify-center z-10">
            <div className="flex items-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="text-foreground">Loading incidents...</span>
            </div>
          </div>
        )}
        {error && (
          <div className="absolute top-4 right-4 bg-card border rounded-lg p-3 z-10 max-w-sm">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <p className="text-sm text-foreground">
                Error loading incidents: {error}
              </p>
            </div>
          </div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px] [&>button]:hidden">
          <div className="absolute right-3 top-3 z-50">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsDialogOpen(false)}
              className="h-8 w-8 rounded-full"
              disabled={isSubmitting}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </div>
          <DialogHeader>
            <DialogTitle>Report New Incident</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div className="space-y-2 w-full">
              <Label htmlFor="type">Incident Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, type: value }))
                }
                className="w-full"
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent className="w-full min-w-[200px]">
                  <SelectItem value="power_cut">Power Cut</SelectItem>
                  <SelectItem value="traffic_jam">Traffic Jam</SelectItem>
                  <SelectItem value="safety_issue">Safety Issue</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe the incident..."
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                required
                disabled={isSubmitting}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="latitude">Latitude</Label>
                <Input
                  id="latitude"
                  type="number"
                  step="any"
                  placeholder="Latitude"
                  value={formData.latitude}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      latitude: e.target.value,
                    }))
                  }
                  required
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="longitude">Longitude</Label>
                <Input
                  id="longitude"
                  type="number"
                  step="any"
                  placeholder="Longitude"
                  value={formData.longitude}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      longitude: e.target.value,
                    }))
                  }
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Report Incident"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
