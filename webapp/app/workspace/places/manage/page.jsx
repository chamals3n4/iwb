"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Search,
  Trash2,
  Eye,
  Loader2,
  XCircle,
  Plus,
  Building2,
} from "lucide-react";
import Link from "next/link";

const API_BASE_URL = "http://localhost:8080";

export default function ManagePlacesPage() {
  const router = useRouter();
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [placeToDelete, setPlaceToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

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

  const handleDeletePlace = async () => {
    if (!placeToDelete) return;

    try {
      setDeleting(true);
      const response = await fetch(
        `${API_BASE_URL}/api/places/${placeToDelete.placeId}`,
        {
          method: "DELETE",
        },
      );

      const data = await response.json();

      if (response.ok && data.success) {
        setPlaces((prev) =>
          prev.filter((place) => place.placeId !== placeToDelete.placeId),
        );
        setDeleteDialogOpen(false);
        setPlaceToDelete(null);
      } else {
        setError(data.message || "Failed to delete place");
      }
    } catch (err) {
      setError("Network error: Unable to delete place");
      console.error("Error deleting place:", err);
    } finally {
      setDeleting(false);
    }
  };

  const openDeleteDialog = (place) => {
    setPlaceToDelete(place);
    setDeleteDialogOpen(true);
  };

  const formatCurrency = (amount, currency) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
    }).format(amount);
  };

  const filteredPlaces = places.filter(
    (place) =>
      place.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      place.location.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-96">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Loading places...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-12">
          <Link
            href="/workspace/places"
            className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Places
          </Link>
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight">Manage Places</h1>
            <p className="text-lg text-muted-foreground">
              View and manage your created places
            </p>
          </div>
        </div>

        <div className="mb-8 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              type="text"
              placeholder="Search places..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Link href="/workspace/places/create">
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add New Place
            </Button>
          </Link>
        </div>

        {error && (
          <Alert className="mb-8 border-destructive/50 bg-destructive/10">
            <XCircle className="h-4 w-4 text-destructive" />
            <AlertDescription className="text-destructive">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {filteredPlaces.length > 0 ? (
          <div className="bg-card border rounded-lg overflow-hidden shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-semibold">Place Name</TableHead>
                  <TableHead className="font-semibold">Location</TableHead>
                  <TableHead className="font-semibold">Price</TableHead>
                  <TableHead className="font-semibold">Capacity</TableHead>
                  <TableHead className="font-semibold">Types</TableHead>
                  <TableHead className="font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPlaces.map((place) => (
                  <TableRow key={place.placeId} className="hover:bg-muted/50">
                    <TableCell>
                      <div className="font-medium">{place.name}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        {place.location}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium">
                        {formatCurrency(
                          place.pricing.price,
                          place.pricing.currency,
                        )}{" "}
                        per {place.pricing.billing}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{place.capacity}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {place.workspaceTypes.slice(0, 2).map((type) => (
                          <Badge
                            key={type}
                            variant="secondary"
                            className="text-xs"
                          >
                            {type}
                          </Badge>
                        ))}
                        {place.workspaceTypes.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{place.workspaceTypes.length - 2} more
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Link href={`/workspace/places/${place.placeId}`}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDeleteDialog(place)}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-muted-foreground mb-6">
              <Building2 className="h-16 w-16 mx-auto" />
            </div>
            <h3 className="text-xl font-semibold mb-2">
              {searchTerm ? "No places found" : "No places yet"}
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              {searchTerm
                ? "Try adjusting your search terms"
                : "Create your first workspace to get started"}
            </p>
            {!searchTerm && (
              <Link href="/workspace/places/create">
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Create Your First Place
                </Button>
              </Link>
            )}
          </div>
        )}
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Place</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{placeToDelete?.name}"? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeletePlace}
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
