"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ArrowLeft,
  Upload,
  Loader2,
  XCircle,
  Calendar,
  MapPin,
  DollarSign,
  Users,
  CheckCircle,
  Clock,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import Link from "next/link";

const API_BASE_URL = "http://localhost:8080";

export default function CreateMeetupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  const [formData, setFormData] = useState({
    eventName: "",
    eventDescription: "",
    eventStartDate: "",
    eventStartTime: "",
    eventEndDate: "",
    eventEndTime: "",
    venueName: "",
    venueGoogleMapsUrl: "",
    isPaidEvent: false,
    eventCost: "",
    hasLimitedCapacity: false,
    eventCapacity: "",
    requireApproval: false,
  });

  const [startDate, setStartDate] = useState();
  const [endDate, setEndDate] = useState();

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleStartDateChange = (date) => {
    setStartDate(date);
    if (date)
      setFormData((prev) => ({
        ...prev,
        eventStartDate: format(date, "yyyy-MM-dd"),
      }));
  };

  const handleEndDateChange = (date) => {
    setEndDate(date);
    if (date)
      setFormData((prev) => ({
        ...prev,
        eventEndDate: format(date, "yyyy-MM-dd"),
      }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const formDataToSend = new FormData();
      Object.keys(formData).forEach((key) => {
        if (
          key === "isPaidEvent" ||
          key === "hasLimitedCapacity" ||
          key === "requireApproval"
        ) {
          formDataToSend.append(key, formData[key].toString());
        } else {
          formDataToSend.append(key, formData[key]);
        }
      });

      if (imageFile) formDataToSend.append("image", imageFile);

      const response = await fetch(`${API_BASE_URL}/event/create`, {
        method: "POST",
        body: formDataToSend,
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setSuccess("Meetup created successfully!");
        setTimeout(() => router.push("/workspace/meetups"), 2000);
      } else {
        setError(result.message || "Failed to create meetup");
      }
    } catch (err) {
      setError("Network error: Unable to create meetup");
      console.error("Error creating meetup:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-12">
          <Link
            href="/workspace/meetups"
            className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Meetups
          </Link>
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight">
              Create a New Meetup
            </h1>
            <p className="text-lg text-muted-foreground">
              Share your event with the community
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-12">
          <section className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold tracking-tight">
                Basic Information
              </h2>
              <p className="text-muted-foreground">Tell us about your event</p>
            </div>
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="eventName" className="text-sm font-medium">
                  Event Name *
                </Label>
                <Input
                  id="eventName"
                  value={formData.eventName}
                  onChange={(e) =>
                    handleInputChange("eventName", e.target.value)
                  }
                  placeholder="Enter event name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="eventDescription"
                  className="text-sm font-medium"
                >
                  Description *
                </Label>
                <Textarea
                  id="eventDescription"
                  value={formData.eventDescription}
                  onChange={(e) =>
                    handleInputChange("eventDescription", e.target.value)
                  }
                  placeholder="Describe your event"
                  rows={4}
                  required
                />
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold tracking-tight">
                Event Image
              </h2>
              <p className="text-muted-foreground">
                Add a cover image for your event
              </p>
            </div>
            <div className="max-w-md">
              {imagePreview ? (
                <div className="relative group">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-64 object-cover rounded-xl border shadow-sm"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={removeImage}
                    className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-xl p-8 text-center hover:border-muted-foreground/50 transition-colors">
                  <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <Label htmlFor="image" className="cursor-pointer">
                    <span className="text-base font-medium text-muted-foreground hover:text-foreground transition-colors">
                      Click to upload image
                    </span>
                  </Label>
                  <Input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </div>
              )}
            </div>
          </section>

          <section className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
                <Calendar className="h-6 w-6" />
                Date and Time
              </h2>
              <p className="text-muted-foreground">
                When will your event take place?
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Start Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={startDate}
                      onSelect={handleStartDateChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label htmlFor="eventStartTime" className="text-sm font-medium">
                  Start Time *
                </Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="eventStartTime"
                    type="time"
                    value={formData.eventStartTime}
                    onChange={(e) =>
                      handleInputChange("eventStartTime", e.target.value)
                    }
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">End Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={endDate}
                      onSelect={handleEndDateChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label htmlFor="eventEndTime" className="text-sm font-medium">
                  End Time *
                </Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="eventEndTime"
                    type="time"
                    value={formData.eventEndTime}
                    onChange={(e) =>
                      handleInputChange("eventEndTime", e.target.value)
                    }
                    className="pl-10"
                    required
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
                <MapPin className="h-6 w-6" />
                Venue Information
              </h2>
              <p className="text-muted-foreground">
                Where will your event be held?
              </p>
            </div>
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="venueName" className="text-sm font-medium">
                  Venue Name *
                </Label>
                <Input
                  id="venueName"
                  value={formData.venueName}
                  onChange={(e) =>
                    handleInputChange("venueName", e.target.value)
                  }
                  placeholder="Enter venue name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="venueGoogleMapsUrl"
                  className="text-sm font-medium"
                >
                  Google Maps URL *
                </Label>
                <Input
                  id="venueGoogleMapsUrl"
                  value={formData.venueGoogleMapsUrl}
                  onChange={(e) =>
                    handleInputChange("venueGoogleMapsUrl", e.target.value)
                  }
                  placeholder="https://maps.google.com/..."
                  required
                />
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
                <DollarSign className="h-6 w-6" />
                Pricing and Capacity
              </h2>
              <p className="text-muted-foreground">
                Set pricing and attendance limits
              </p>
            </div>
            <div className="space-y-8">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="isPaidEvent"
                    checked={formData.isPaidEvent}
                    onCheckedChange={(checked) =>
                      handleInputChange("isPaidEvent", checked)
                    }
                    className="h-5 w-5"
                  />
                  <Label
                    htmlFor="isPaidEvent"
                    className="text-base font-medium cursor-pointer"
                  >
                    This is a paid event
                  </Label>
                </div>
                {formData.isPaidEvent && (
                  <div className="space-y-2 ml-8">
                    <Label htmlFor="eventCost" className="text-sm font-medium">
                      Event Cost ($) *
                    </Label>
                    <Input
                      id="eventCost"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.eventCost}
                      onChange={(e) =>
                        handleInputChange("eventCost", e.target.value)
                      }
                      placeholder="0.00"
                      required={formData.isPaidEvent}
                    />
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="hasLimitedCapacity"
                    checked={formData.hasLimitedCapacity}
                    onCheckedChange={(checked) =>
                      handleInputChange("hasLimitedCapacity", checked)
                    }
                    className="h-5 w-5"
                  />
                  <Label
                    htmlFor="hasLimitedCapacity"
                    className="text-base font-medium cursor-pointer"
                  >
                    Limited capacity
                  </Label>
                </div>
                {formData.hasLimitedCapacity && (
                  <div className="space-y-2 ml-8">
                    <Label
                      htmlFor="eventCapacity"
                      className="text-sm font-medium"
                    >
                      Maximum Capacity *
                    </Label>
                    <Input
                      id="eventCapacity"
                      type="number"
                      min="1"
                      value={formData.eventCapacity}
                      onChange={(e) =>
                        handleInputChange("eventCapacity", e.target.value)
                      }
                      placeholder="50"
                      required={formData.hasLimitedCapacity}
                    />
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="requireApproval"
                    checked={formData.requireApproval}
                    onCheckedChange={(checked) =>
                      handleInputChange("requireApproval", checked)
                    }
                    className="h-5 w-5"
                  />
                  <Label
                    htmlFor="requireApproval"
                    className="text-base font-medium cursor-pointer"
                  >
                    Require approval for attendees
                  </Label>
                </div>
              </div>
            </div>
          </section>

          <div className="flex justify-end pt-8">
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Creating Meetup...
                </>
              ) : (
                <>
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Create Meetup
                </>
              )}
            </Button>
          </div>
        </form>

        {error && (
          <Alert className="mt-8 border-destructive/50 bg-destructive/10">
            <XCircle className="h-4 w-4 text-destructive" />
            <AlertDescription className="text-destructive">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mt-8 border-green-500/50 bg-green-500/10">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700 dark:text-green-400">
              {success}
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}
