"use client";

import { useState, useEffect } from "react";
import { Search, MapPin, Briefcase, X, XCircle } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
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
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { Alert, AlertDescription } from "@/components/ui/alert";

const filters = [
  {
    id: "positionType",
    label: "Position Type",
    icon: Briefcase,
    options: [
      { value: "Full Time", label: "Full Time" },
      { value: "Part Time", label: "Part Time" },
      { value: "Contract", label: "Contract" },
    ],
  },
  {
    id: "category",
    label: "Category",
    icon: MapPin,
    options: [
      { value: "Development", label: "Development" },
      { value: "Design", label: "Design" },
      { value: "Marketing", label: "Marketing" },
      { value: "Sales", label: "Sales" },
      { value: "Management", label: "Management" },
      { value: "Customer Success", label: "Customer Success" },
      { value: "Human Resources", label: "Human Resources" },
      { value: "Finance", label: "Finance" },
      { value: "Administration", label: "Administration" },
      { value: "Consulting", label: "Consulting" },
      { value: "Education", label: "Education" },
      { value: "Healthcare", label: "Healthcare" },
      { value: "Legal", label: "Legal" },
      { value: "System Administration", label: "System Administration" },
      { value: "Writing", label: "Writing" },
    ],
  },
  {
    id: "remote",
    label: "Remote",
    icon: MapPin,
    options: [
      { value: "remote", label: "Remote Only" },
      { value: "hybrid", label: "Hybrid" },
      { value: "onsite", label: "On-site" },
    ],
  },
];

export default function JobListingsPage() {
  const isMobile = useIsMobile();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState({
    positionType: "all",
    category: "all",
    remote: "all",
    minSalary: "",
    maxSalary: "",
  });
  const [savedJobs, setSavedJobs] = useState([]);
  const [sortBy, setSortBy] = useState("newest");
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams();
        if (activeFilters.positionType && activeFilters.positionType !== "all")
          params.append("positionType", activeFilters.positionType);
        if (activeFilters.category && activeFilters.category !== "all")
          params.append("category", activeFilters.category);
        if (activeFilters.minSalary)
          params.append("minSalary", activeFilters.minSalary);
        if (activeFilters.maxSalary)
          params.append("maxSalary", activeFilters.maxSalary);

        const queryString = params.toString();
        const url = `http://localhost:8080/api/jobs${queryString ? `?${queryString}` : ""}`;

        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to fetch jobs (${response.status})`);
        }
        const jobsData = await response.json();
        setJobs(jobsData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, [activeFilters]);

  const updateFilter = (filterId, value) => {
    setActiveFilters((prev) => ({ ...prev, [filterId]: value }));
  };

  const clearAllFilters = () => {
    setActiveFilters({
      positionType: "all",
      category: "all",
      remote: "all",
      minSalary: "",
      maxSalary: "",
    });
  };

  const toggleSaveJob = (jobUrl) => {
    setSavedJobs((prev) =>
      prev.includes(jobUrl)
        ? prev.filter((url) => url !== jobUrl)
        : [...prev, jobUrl],
    );
  };

  const handleJobClick = (jobUrl) => {
    window.open(jobUrl, "_blank");
  };

  const retryFetch = () => {
    setError(null);
    setLoading(true);
    setActiveFilters((prev) => ({ ...prev }));
  };

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      !searchQuery ||
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRemote =
      !activeFilters.remote ||
      activeFilters.remote === "all" ||
      (activeFilters.remote === "remote" &&
        job.location.toLowerCase().includes("remote")) ||
      (activeFilters.remote === "hybrid" &&
        job.location.toLowerCase().includes("hybrid")) ||
      (activeFilters.remote === "onsite" &&
        !job.location.toLowerCase().includes("remote") &&
        !job.location.toLowerCase().includes("hybrid"));

    return matchesSearch && matchesRemote;
  });

  const formatLocation = (loc) => {
    if (!loc) return "";
    return loc
      .split(/[,|/]/)
      .map((s) => s.trim())
      .filter(Boolean)
      .join("; ");
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now - date);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) return "1 day ago";
      if (diffDays < 7) return `${diffDays} days ago`;
      if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    } catch {
      return "Recently";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-[1100px] mx-auto px-2 py-6">
          <div className="mb-8">
            <h1 className="text-3xl font-semibold text-foreground mb-1">
              Find Jobs Beyond Borders – From Sri Lanka
            </h1>
            <p className="text-muted-foreground">
              Discover remote opportunities that let you work for global
              companies while staying in Sri Lanka.
            </p>
          </div>
          <div className="flex items-center justify-center py-16">
            <div className="flex flex-col items-center gap-4">
              <div className="w-8 h-8 border-4 border-foreground border-t-transparent rounded-full animate-spin"></div>
              <p className="text-foreground">Loading remote jobs...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-[1100px] mx-auto px-2 py-6">
          <div className="mb-8">
            <h1 className="text-3xl font-semibold text-foreground mb-1">
              Find Jobs Beyond Borders – From Sri Lanka
            </h1>
            <p className="text-muted-foreground">
              Discover remote opportunities that let you work for global
              companies while staying in Sri Lanka.
            </p>
          </div>
          <Alert className="mb-6">
            <XCircle className="h-4 w-4 text-red-600" />
            <AlertDescription>
              {error.includes("Failed to fetch")
                ? "Please check your internet connection and try again."
                : error}
            </AlertDescription>
          </Alert>
          <Button onClick={retryFetch} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1100px] mx-auto px-2 py-6">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-foreground mb-1">
            Find Jobs Beyond Borders – From Sri Lanka
          </h1>
          <p className="text-muted-foreground">
            Discover remote opportunities that let you work for global companies
            while staying in Sri Lanka.
          </p>
        </div>

        <div className="mb-6 flex items-center gap-3">
          <div className="relative flex-1 max-w-lg">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search jobs, companies, or keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-background border-input focus:border-ring focus:ring-ring h-9"
            />
          </div>

          <Sheet
            open={isOpen}
            onOpenChange={(open) => !open && setIsOpen(false)}
          >
            <SheetTrigger asChild>
              <Button className="h-9 px-4" onClick={() => setIsOpen(true)}>
                Advanced Filters
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
                  onClick={() => setIsOpen(false)}
                  className="h-8 w-8 rounded-full"
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Close</span>
                </Button>
              </div>

              <SheetHeader className="p-4 pb-2">
                <SheetTitle className="text-xl">Advanced Filters</SheetTitle>
              </SheetHeader>
              <div className="px-4 pt-2 pb-4 space-y-3">
                {filters.map((filter) => (
                  <div key={filter.id} className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground/80">
                      {filter.label}
                    </label>
                    <Select
                      value={activeFilters[filter.id]}
                      onValueChange={(value) => updateFilter(filter.id, value)}
                    >
                      <SelectTrigger className="h-9 w-full">
                        <SelectValue placeholder={filter.label} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All {filter.label}</SelectItem>
                        {filter.options.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground/80">
                      Min salary
                    </label>
                    <Input
                      type="number"
                      placeholder="e.g. 50000"
                      value={activeFilters.minSalary}
                      onChange={(e) =>
                        updateFilter("minSalary", e.target.value)
                      }
                      className="h-9 w-full"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground/80">
                      Max salary
                    </label>
                    <Input
                      type="number"
                      placeholder="e.g. 120000"
                      value={activeFilters.maxSalary}
                      onChange={(e) =>
                        updateFilter("maxSalary", e.target.value)
                      }
                      className="h-9 w-full"
                    />
                  </div>
                </div>
              </div>
              <SheetFooter>
                <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                  Clear
                </Button>
                <SheetClose asChild>
                  <Button size="sm">Apply</Button>
                </SheetClose>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>

        <div className="space-y-4">
          {filteredJobs.map((job) => (
            <Card
              key={job.url}
              className="border-2 hover:border-primary rounded-xl shadow-none transition-all duration-200 cursor-pointer"
              onClick={() => handleJobClick(job.url)}
            >
              <CardContent className="px-5 py-1">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0 pr-4">
                    <h3 className="text-xl leading-6 font-medium text-foreground mb-1 truncate">
                      {job.title}
                    </h3>
                    <p className="text-lg leading-5 text-muted-foreground truncate">
                      {formatLocation(job.location)}
                    </p>
                  </div>
                  <div className="ml-4 flex-shrink-0">
                    <svg
                      className="w-5 h-5 transition-transform duration-150 group-hover:translate-x-0.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredJobs.length === 0 && !loading && (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 bg-muted">
              <Briefcase className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">
              No jobs found
            </h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Try adjusting your search terms or filters to discover more
              opportunities.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
