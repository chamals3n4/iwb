"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Search,
  MapPin,
  Calendar,
  Loader2,
  XCircle,
  Heart,
  X,
  Plus,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";

const API_BASE_URL = "http://localhost:8080";

export default function EventsListing() {
  const isMobile = useIsMobile();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedCity, setSelectedCity] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [savedIds, setSavedIds] = useState([]);
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("savedMeetups");
      if (saved) setSavedIds(JSON.parse(saved));
    } catch (err) {
      console.error("Error loading saved meetups:", err);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("savedMeetups", JSON.stringify(savedIds));
    } catch (err) {
      console.error("Error saving meetups:", err);
    }
  }, [savedIds]);

  useEffect(() => {
    const fetchMeetups = async () => {
      if (hasFetchedRef.current) return;
      hasFetchedRef.current = true;

      try {
        setLoading(true);
        setError("");

        const response = await fetch(`${API_BASE_URL}/api/meetups`);
        const data = await response.json();

        if (response.ok) {
          if (data.success && data.data) {
            setEvents(data.data);
          } else {
            setError(data.message || "No meetups data received");
          }
        } else {
          setError(data.message || "Failed to fetch meetups");
        }
      } catch (err) {
        setError("Network error: Unable to fetch meetups");
        console.error("Error fetching meetups:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMeetups();
  }, []);

  const handleRefresh = useCallback(() => {
    hasFetchedRef.current = false;
    setLoading(true);
    setError("");
    window.location.reload();
  }, []);

  const cities = useMemo(
    () =>
      Array.from(
        new Set(events.map((event) => event.venueName).filter(Boolean)),
      ),
    [events],
  );

  const formatDateTime = useCallback((date, time) => {
    try {
      const datetime = new Date(`${date}T${time}`);
      return {
        date: datetime.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        time: datetime.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        }),
      };
    } catch {
      return { date, time };
    }
  }, []);

  const formatCurrency = useCallback((amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  }, []);

  const debouncedSearch = useDebouncedValue(searchTerm, 200);

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const cityMatch =
        selectedCity === "all" || event.venueName === selectedCity;
      const categoryMatch = selectedCategory === "all";
      const searchMatch =
        debouncedSearch === "" ||
        event.eventName.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        event.venueName.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        (event.eventDescription &&
          event.eventDescription
            .toLowerCase()
            .includes(debouncedSearch.toLowerCase()));

      const eventDate = new Date(event.eventStartDate);
      const today = new Date();
      const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      const nextMonth = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

      let dateMatch = true;
      if (dateFilter === "week") dateMatch = eventDate <= nextWeek;
      else if (dateFilter === "month") dateMatch = eventDate <= nextMonth;

      return cityMatch && categoryMatch && searchMatch && dateMatch;
    });
  }, [events, selectedCity, selectedCategory, debouncedSearch, dateFilter]);

  const formatDisplayDate = useCallback((dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }, []);

  const handleSaveToggle = useCallback((e, eventId) => {
    e.preventDefault();
    e.stopPropagation();
    setSavedIds((prev) =>
      prev.includes(eventId)
        ? prev.filter((id) => id !== eventId)
        : [...prev, eventId],
    );
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="mb-6">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
              Connect With Nomads & Locals in Sri Lanka 🏝️
            </h1>
            <p className="text-muted-foreground mt-1">
              Whether you're in the city or by the beach, find fun meetups that
              help you connect, share, and explore.
            </p>
          </div>
          <div className="flex items-center justify-center min-h-72">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Loading meetups...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="mb-6">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
              Connect With Nomads & Locals in Sri Lanka 🏝️
            </h1>
            <p className="text-muted-foreground mt-1">
              Whether you're in the city or by the beach, find fun meetups that
              help you connect, share, and explore.
            </p>
          </div>
          <Alert className="mb-6">
            <XCircle className="h-4 w-4 text-red-600" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button onClick={handleRefresh} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
              Connect With Nomads & Locals in Sri Lanka 🏝️
            </h1>
            <p className="text-muted-foreground mt-1">
              Whether you're in the city or by the beach, find fun meetups that
              help you connect, share, and explore.
            </p>
          </div>
          <Link href="/workspace/meetups/create">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Meetup
            </Button>
          </Link>
        </div>

        <div className="mb-6 flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              type="text"
              placeholder="Search by title, location, or host"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-9"
            />
          </div>
          <Sheet open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
            <SheetTrigger asChild>
              <Button className="h-9 px-4">Advanced Filters</Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className={`${isMobile ? "max-w-[95%] max-h-[80vh] p-4 rounded-xl" : "max-w-3xl p-6 rounded-xl"} overflow-hidden flex flex-col [&>button]:hidden`}
            >
              <div className="absolute right-3 top-3 z-50">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsFiltersOpen(false)}
                  className="h-8 w-8 rounded-full"
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Close</span>
                </Button>
              </div>
              <SheetHeader className="p-4 pb-2">
                <SheetTitle className="text-xl">Advanced Filters</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-3">
                <div className="w-full sm:max-w-xs">
                  <label className="text-sm font-medium text-foreground/80 mb-1 block">
                    Date
                  </label>
                  <Select value={dateFilter} onValueChange={setDateFilter}>
                    <SelectTrigger
                      aria-label="Date"
                      className="h-9 text-sm w-full"
                    >
                      <SelectValue placeholder="Any time" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Any time</SelectItem>
                      <SelectItem value="week">Next 7 days</SelectItem>
                      <SelectItem value="month">Next 30 days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-full sm:max-w-xs">
                  <label className="text-sm font-medium text-foreground/80 mb-1 block">
                    Location
                  </label>
                  <Select value={selectedCity} onValueChange={setSelectedCity}>
                    <SelectTrigger
                      aria-label="Location"
                      className="h-9 text-sm w-full"
                    >
                      <SelectValue placeholder="All locations" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All locations</SelectItem>
                      {cities.map((city) => (
                        <SelectItem key={city} value={city}>
                          {city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <SheetFooter className="mt-6 flex flex-col gap-2 px-4 sm:px-0">
                <Button
                  variant="ghost"
                  className="w-full sm:max-w-xs"
                  onClick={() => {
                    setSelectedCity("all");
                    setDateFilter("all");
                  }}
                >
                  Clear
                </Button>
                <SheetClose asChild>
                  <Button className="w-full sm:max-w-xs">Apply</Button>
                </SheetClose>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event) => {
            const { date, time } = formatDateTime(
              event.eventStartDate,
              event.eventStartTime,
            );
            return (
              <Link
                key={event.eventId}
                href={`/workspace/meetups/${event.eventId}`}
              >
                <div className="group rounded-xl overflow-hidden border transition-all cursor-pointer bg-card hover:shadow-sm">
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <img
                      src={event.imageUrl || "/images/hero.avif"}
                      alt={event.eventName}
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                      onError={(e) => {
                        e.currentTarget.src = "/images/hero.avif";
                      }}
                    />
                    <button
                      onClick={(e) => handleSaveToggle(e, event.eventId)}
                      aria-label="Save meetup"
                      className="absolute top-3 right-3 inline-flex items-center justify-center h-9 w-9 rounded-full bg-background/90 text-foreground shadow-sm"
                    >
                      <Heart
                        className={`h-5 w-5 ${savedIds.includes(event.eventId) ? "fill-red-500 text-red-500" : ""}`}
                      />
                    </button>
                  </div>
                  <div className="p-3">
                    <h3 className="font-medium text-[15px] text-foreground truncate">
                      {event.eventName}
                    </h3>
                    <p className="text-[13px] text-muted-foreground truncate">
                      {event.venueName}
                    </p>
                    <p className="text-[13px] text-muted-foreground mt-1">
                      {formatDisplayDate(event.eventStartDate)} • {time}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {event.isPaidEvent && (
                        <Badge variant="secondary" className="text-[11px]">
                          {formatCurrency(event.eventCost)}
                        </Badge>
                      )}
                      {event.hasLimitedCapacity && (
                        <Badge variant="secondary" className="text-[11px]">
                          Limited ({event.eventCapacity} max)
                        </Badge>
                      )}
                      {event.requireApproval && (
                        <Badge variant="secondary" className="text-[11px]">
                          Approval Required
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {filteredEvents.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              No meetups found matching your criteria.
            </p>
            {(searchTerm !== "" ||
              selectedCity !== "all" ||
              dateFilter !== "all") && (
              <Button
                onClick={() => {
                  setSearchTerm("");
                  setSelectedCity("all");
                  setDateFilter("all");
                }}
                variant="outline"
                className="mt-4"
              >
                Clear Filters
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function useDebouncedValue(value, delayMs) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}
