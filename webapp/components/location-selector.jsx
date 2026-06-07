"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { X, Loader2 } from "lucide-react";
import { User } from "@asgardeo/nextjs";

const SearchBox = dynamic(
  () => import("@mapbox/search-js-react").then((mod) => mod.SearchBox),
  { ssr: false },
);

let mapboxAccessToken = "";
if (typeof window !== "undefined") {
  mapboxAccessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || "";
}

function LocationSelectorInner({ user, onLocationSet, currentLocation }) {
  const [userLocation, setUserLocation] = useState(currentLocation || null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLocationSelect = (result) => {
    const { coordinates } = result.features[0].geometry;
    setUserLocation({
      cityName: result.features[0].place_name,
      latitude: coordinates[1],
      longitude: coordinates[0],
    });
  };

  const saveLocation = async () => {
    if (!userLocation || !user?.sub) return;

    const location = {
      ...userLocation,
      cityName:
        userLocation.cityName ||
        `Location (${userLocation.latitude.toFixed(4)}, ${userLocation.longitude.toFixed(4)})`,
    };

    try {
      setIsLoading(true);
      const response = await fetch(
        `http://localhost:8080/api/users/${user.sub}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            cityName: location.cityName,
            cityLatitude: location.latitude,
            cityLongitude: location.longitude,
          }),
        },
      );

      if (response.ok) {
        onLocationSet?.(location);
      }
    } catch (error) {
      console.error("Error saving location:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const clearLocation = () => {
    setUserLocation(null);
  };

  return (
    <div className="relative z-0">
      <Card className="relative overflow-hidden p-4 space-y-3 bg-card border">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-purple-50 dark:hidden" />
        <div className="relative flex items-center justify-between">
          <h3 className="font-semibold text-sm text-foreground">
            Set Your Location
          </h3>
          {userLocation && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearLocation}
              className="h-6 w-6 p-0 hover:bg-muted"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        <div className="relative w-full">
          <SearchBox
            accessToken={mapboxAccessToken}
            onRetrieve={handleLocationSelect}
            placeholder="Search for your city..."
            options={{
              types: "place,locality",
              language: ["en"],
              limit: 8,
            }}
          />
        </div>

        <div className="relative space-y-2">
          {userLocation && (
            <div className="p-2 bg-muted rounded text-sm">
              <p className="font-medium text-foreground">
                {userLocation.cityName}
              </p>
              <p className="text-xs text-muted-foreground">
                {userLocation.latitude.toFixed(4)},{" "}
                {userLocation.longitude.toFixed(4)}
              </p>
            </div>
          )}
          <Button
            onClick={saveLocation}
            className="w-full"
            disabled={!userLocation || isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : userLocation ? (
              "Save Location"
            ) : (
              "Search a city to save"
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
}

export default function LocationSelector({ onLocationSet, currentLocation }) {
  return (
    <User>
      {(user) => (
        <LocationSelectorInner
          user={user}
          onLocationSet={onLocationSet}
          currentLocation={currentLocation}
        />
      )}
    </User>
  );
}
