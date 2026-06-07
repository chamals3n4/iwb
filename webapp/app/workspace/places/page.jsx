"use client";

import { useState, useEffect } from "react";
import {
  Search,
  MapPin,
  Star,
  SlidersHorizontal,
  Loader2,
  XCircle,
  X,
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";

const API_BASE_URL = "http://localhost:8080";

const durationOptions = [
  { value: "hourly", label: "Hourly", key: "pricePerHour" },
  { value: "daily", label: "Daily", key: "pricePerDay" },
  { value: "weekly", label: "Weekly", key: "pricePerWeek" },
  { value: "monthly", label: "Monthly", key: "pricePerMonth" },
];

const typeFilters = [
  "Flexible Workspace",
  "Creative Studio",
  "Private Office",
  "Meeting Room",
];

const amenityFilters = [
  "High-Speed WiFi",
  "Meeting Rooms",
  "Parking",
  "Coffee Bar",
  "24/7 Access",
  "Gym",
];

export default function CoworkingPlacesPage() {
  const isMobile = useIsMobile();
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDuration, setSelectedDuration] = useState("daily");
  const [budgetRange, setBudgetRange] = useState([0, 3000000]);
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [savedSpaces, setSavedSpaces] = useState([]);
  const [sortBy, setSortBy] = useState("featured");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const fetchPlaces = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_BASE_URL}/api/places`);
      const data = await response.json();

      if (response.ok) {
        if (data.success && data.data) {
          setPlaces(data.data);
        } else {
          setError(data.message || "No places data received");
        }
      } else {
        setError(data.message || "Failed to fetch places");
      }
    } catch (err) {
      setError("Network error: Unable to fetch places");
      console.error("Error fetching places:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlaces();
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("savedPlaces");
      if (saved) setSavedSpaces(JSON.parse(saved));
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("savedPlaces", JSON.stringify(savedSpaces));
    } catch {}
  }, [savedSpaces]);

  const toggleTypeFilter = (type) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    );
  };

  const toggleAmenityFilter = (amenity) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenity)
        ? prev.filter((a) => a !== amenity)
        : [...prev, amenity],
    );
  };

  const clearAllFilters = () => {
    setSelectedTypes([]);
    setSelectedAmenities([]);
    setBudgetRange([0, 3000000]);
  };

  const toggleSaveSpace = (placeId) => {
    setSavedSpaces((prev) =>
      prev.includes(placeId)
        ? prev.filter((id) => id !== placeId)
        : [...prev, placeId],
    );
  };

  const getCurrentPrice = (place) => {
    return place.pricing.price;
  };

  const formatPrice = (place) => {
    const price = place.pricing.price;
    const currency = place.pricing.currency;
    const billing = place.pricing.billing;

    return (
      new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currency,
      }).format(price) + ` per ${billing}`
    );
  };

  const filteredPlaces = places.filter((place) => {
    const matchesSearch =
      place.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      place.location.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType =
      selectedTypes.length === 0 ||
      selectedTypes.some((type) => place.workspaceTypes.includes(type));

    const matchesAmenities =
      selectedAmenities.length === 0 ||
      selectedAmenities.every((amenity) => place.amenities.includes(amenity));

    const currentPrice = getCurrentPrice(place);
    const matchesBudget =
      currentPrice >= budgetRange[0] && currentPrice <= budgetRange[1];

    return matchesSearch && matchesType && matchesAmenities && matchesBudget;
  });

  const activeFiltersCount =
    selectedTypes.length +
    selectedAmenities.length +
    (budgetRange[0] > 0 || budgetRange[1] < 3000000 ? 1 : 0);

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            Find the Perfect Desk, Anywhere You Go
          </h1>
          <p className="text-muted-foreground mt-1">
            Compare and choose co-working spaces that make working away from
            home effortless.
          </p>
        </div>
        <div className="flex items-center justify-center min-h-72">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading places...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            Find the Perfect Desk, Anywhere You Go
          </h1>
          <p className="text-muted-foreground mt-1">
            Compare and choose co-working spaces that make working away from
            home effortless.
          </p>
        </div>
        <Alert className="mb-6">
          <XCircle className="h-4 w-4 text-red-600" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={fetchPlaces} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            Find the Perfect Desk, Anywhere You Go
          </h1>
          <p className="text-muted-foreground mt-1">
            Compare and choose co-working spaces that make working away from
            home effortless.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-sm text-muted-foreground">
            {filteredPlaces.length} spaces available
          </div>
          <Link href="/workspace/places/create">
            <Button>Add New Space</Button>
          </Link>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search spaces..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={selectedDuration} onValueChange={setSelectedDuration}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {durationOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="relative">
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              Filters
              {activeFiltersCount > 0 && (
                <Badge className="ml-2 h-5 w-5 p-0 text-xs rounded-full flex items-center justify-center">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>

          <SheetContent
            side="right"
            className={`${isMobile ? "max-w-[95%] max-h-[80vh] p-4 rounded-xl" : "max-w-3xl p-6 rounded-xl"} overflow-hidden flex flex-col [&>button]:hidden`}
          >
            <div className="absolute right-3 top-3 z-50">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsFilterOpen(false)}
                className="h-8 w-8 rounded-full"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </Button>
            </div>

            <SheetHeader className="p-4 pb-2">
              <SheetTitle className="text-2xl">Filter Workspaces</SheetTitle>
            </SheetHeader>
            <div className="px-4 pt-2 pb-4 space-y-6">
              <div className="space-y-4">
                <label className="block text-md font-medium">
                  Budget Range: ${budgetRange[0]} - ${budgetRange[1]} per{" "}
                  {selectedDuration.replace("ly", "")}
                </label>
                <Slider
                  value={budgetRange}
                  onValueChange={setBudgetRange}
                  max={3000000}
                  min={0}
                  step={10000}
                  className="w-full"
                />
              </div>

              <Separator />

              <div className="space-y-4">
                <label className="block text-md font-medium">
                  Workspace Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {typeFilters.map((type) => (
                    <Button
                      key={type}
                      variant={
                        selectedTypes.includes(type) ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => toggleTypeFilter(type)}
                      className="justify-start h-9 text-sm px-3 py-2 w-full"
                    >
                      <span className="truncate">{type}</span>
                    </Button>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <label className="block text-md font-medium">Amenities</label>
                <div className="grid grid-cols-2 gap-2">
                  {amenityFilters.map((amenity) => (
                    <Button
                      key={amenity}
                      variant={
                        selectedAmenities.includes(amenity)
                          ? "default"
                          : "outline"
                      }
                      size="sm"
                      onClick={() => toggleAmenityFilter(amenity)}
                      className="justify-start h-9 text-sm px-3 py-2 w-full"
                    >
                      <span className="truncate">{amenity}</span>
                    </Button>
                  ))}
                </div>
              </div>

              {activeFiltersCount > 0 && (
                <div className="pt-4 border-t">
                  <Button
                    variant="ghost"
                    onClick={clearAllFilters}
                    className="w-full h-9 text-sm"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Clear All Filters ({activeFiltersCount})
                  </Button>
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>

        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-40 bg-white border-gray-200">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="featured">Featured</SelectItem>
            <SelectItem value="price-low">Price: Low to High</SelectItem>
            <SelectItem value="price-high">Price: High to Low</SelectItem>
            <SelectItem value="rating">Highest Rated</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {activeFiltersCount > 0 && (
        <div className="flex items-center space-x-2 flex-wrap">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          {selectedTypes.map((type) => (
            <Badge key={type} variant="secondary">
              {type}
              <button onClick={() => toggleTypeFilter(type)} className="ml-1">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          {selectedAmenities.map((amenity) => (
            <Badge key={amenity} variant="secondary">
              {amenity}
              <button
                onClick={() => toggleAmenityFilter(amenity)}
                className="ml-1"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          {(budgetRange[0] > 0 || budgetRange[1] < 3000000) && (
            <Badge variant="secondary">
              ${budgetRange[0]}-${budgetRange[1]}
              <button
                onClick={() => setBudgetRange([0, 3000000])}
                className="ml-1"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredPlaces.map((place) => (
          <div
            key={place.placeId}
            className="cursor-pointer group"
            onClick={() => console.log("Navigate to place:", place.placeId)}
          >
            <div className="relative rounded-lg overflow-hidden">
              {place.photoUrls && place.photoUrls.length > 0 ? (
                <img
                  src={place.photoUrls[0]}
                  alt={place.name}
                  className="w-full h-64 object-cover transition-transform duration-500 hover:scale-105"
                />
              ) : (
                <div className="w-full h-64 bg-muted flex items-center justify-center">
                  <MapPin className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
            </div>

            <div className="pt-3 space-y-1">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground truncate">
                  {place.name}
                </h3>
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3 fill-current text-yellow-500" />
                  <span className="text-sm font-medium text-muted-foreground">
                    {place.rating || "New"}
                  </span>
                </div>
              </div>
              <div className="flex items-center text-sm text-muted-foreground mb-1">
                <MapPin className="w-3 h-3 mr-1 flex-shrink-0" />
                <span className="truncate">{place.location}</span>
              </div>
              <p className="text-sm text-muted-foreground truncate">
                {formatPrice(place)} • {place.capacity} people
              </p>
            </div>
          </div>
        ))}
      </div>

      {filteredPlaces.length === 0 && (
        <div className="text-center py-12">
          <div className="text-muted-foreground mb-4">
            <MapPin className="h-16 w-16 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">
            No spaces found
          </h3>
          <p className="text-muted-foreground mb-4">
            Try adjusting your filters or search terms
          </p>
          <Button onClick={clearAllFilters} variant="outline">
            Clear All Filters
          </Button>
        </div>
      )}
    </div>
  );
}
