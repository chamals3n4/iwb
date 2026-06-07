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
import { ArrowLeft, Search, Trash2, Eye, Loader2, XCircle } from "lucide-react";
import Link from "next/link";

const API_BASE_URL = "http://localhost:8080";

export default function ManageMeetupsPage() {
  const router = useRouter();
  const [meetups, setMeetups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [meetupToDelete, setMeetupToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchMeetups = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_BASE_URL}/api/meetups`);
      const data = await response.json();

      if (response.ok) {
        if (data.success && data.data) {
          setMeetups(data.data);
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

  useEffect(() => {
    fetchMeetups();
  }, []);

  const handleDeleteMeetup = async () => {
    if (!meetupToDelete) return;

    try {
      setDeleting(true);
      const response = await fetch(
        `${API_BASE_URL}/api/meetups/${meetupToDelete.eventId}`,
        { method: "DELETE" },
      );
      const data = await response.json();

      if (response.ok && data.success) {
        setMeetups((prev) =>
          prev.filter((meetup) => meetup.eventId !== meetupToDelete.eventId),
        );
        setDeleteDialogOpen(false);
        setMeetupToDelete(null);
      } else {
        setError(data.message || "Failed to delete meetup");
      }
    } catch (err) {
      setError("Network error: Unable to delete meetup");
      console.error("Error deleting meetup:", err);
    } finally {
      setDeleting(false);
    }
  };

  const openDeleteDialog = (meetup) => {
    setMeetupToDelete(meetup);
    setDeleteDialogOpen(true);
  };

  const formatDateTime = (date, time) => {
    try {
      const datetime = new Date(`${date}T${time}`);
      return datetime.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    } catch {
      return `${date} ${time}`;
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const filteredMeetups = meetups.filter(
    (meetup) =>
      meetup.eventName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      meetup.venueName.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-96">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Loading meetups...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <Link
            href="/workspace/meetups"
            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Meetups
          </Link>
          <h1 className="text-3xl font-semibold text-gray-900">
            Manage Meetups
          </h1>
          <p className="text-gray-600 mt-2">
            View and manage your created meetups
          </p>
        </div>

        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Search meetups..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <XCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {filteredMeetups.length > 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event Name</TableHead>
                  <TableHead>Venue</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMeetups.map((meetup) => (
                  <TableRow key={meetup.eventId}>
                    <TableCell>
                      <div>
                        <div className="font-medium text-gray-900">
                          {meetup.eventName}
                        </div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {meetup.eventDescription}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-900">
                        {meetup.venueName}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-900">
                        {formatDateTime(
                          meetup.eventStartDate,
                          meetup.eventStartTime,
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {meetup.isPaidEvent && (
                          <Badge
                            variant="secondary"
                            className="text-xs bg-green-100 text-green-800"
                          >
                            {formatCurrency(meetup.eventCost)}
                          </Badge>
                        )}
                        {meetup.hasLimitedCapacity && (
                          <Badge
                            variant="secondary"
                            className="text-xs bg-orange-100 text-orange-800"
                          >
                            Limited ({meetup.eventCapacity} max)
                          </Badge>
                        )}
                        {meetup.requireApproval && (
                          <Badge
                            variant="secondary"
                            className="text-xs bg-blue-100 text-blue-800"
                          >
                            Approval Required
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Link href={`/workspace/meetups/${meetup.eventId}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDeleteDialog(meetup)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
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
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Search className="h-16 w-16 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? "No meetups found" : "No meetups yet"}
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm
                ? "Try adjusting your search terms"
                : "Create your first meetup to get started"}
            </p>
            {!searchTerm && (
              <Link href="/workspace/meetups/create">
                <Button>Create Meetup</Button>
              </Link>
            )}
          </div>
        )}
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Meetup</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{meetupToDelete?.eventName}"?
              This action cannot be undone.
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
              onClick={handleDeleteMeetup}
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
