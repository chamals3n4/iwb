import 'service.utils;

import ballerina/http;
import ballerina/mime;
import ballerina/sql;
import ballerina/time;
import ballerina/uuid;

public isolated function createMeetup(http:Request req) returns EventCreationResult|error {
    mime:Entity[]|http:ClientError bodyParts = req.getBodyParts();
    if bodyParts is error {
        return {success: false, message: "Error parsing multipart data"};
    }

    // Initialize form data map
    // Initialize form data map
    map<string> formData = {};
    string? imageUrl = ();

    // Process form parts
    foreach mime:Entity part in bodyParts {
        mime:ContentDisposition contentDisposition = part.getContentDisposition();
        string partName = contentDisposition.name;

        if partName == "image" {
            utils:ImageUploadResult|error uploadResult = utils:uploadImageToR2(req);
            if uploadResult is utils:ImageUploadResult && uploadResult.success {
                utils:ImageData? imageData = uploadResult?.data;
                if imageData is utils:ImageData {
                    imageUrl = imageData.url;
                }
            }
        } else {
            string|error textContent = part.getText();
            if textContent is string {
                formData[partName] = textContent;
            }
        }
    }

    // Required fields validation
    string[] requiredFields = [
        "eventName",
        "eventDescription",
        "eventStartDate",
        "eventStartTime",
        "eventEndDate",
        "eventEndTime",
        "venueName",
        "venueGoogleMapsUrl"
    ];

    foreach var fld in requiredFields {
        if !formData.hasKey(fld) || formData[fld] == "" {
            return {success: false, message: "Missing required fields: " + string:'join(", ", ...requiredFields)};
        }
    }
    // Parse boolean and numeric fields
    boolean isPaidEvent = formData.get("isPaidEvent") == "true";
    boolean hasLimitedCapacity = formData.get("hasLimitedCapacity") == "true";
    boolean requireApproval = formData.get("requireApproval") == "true";

    decimal? eventCost = isPaidEvent ? parseDecimal(formData.get("eventCost")) : ();
    int? eventCapacity = hasLimitedCapacity ? parseInt(formData.get("eventCapacity")) : ();

    // Business logic validation
    if isPaidEvent && eventCost is () {
        return {success: false, message: "Event cost is required for paid events"};
    }
    if hasLimitedCapacity && eventCapacity is () {
        return {success: false, message: "Event capacity is required for limited capacity events"};
    }

    MeetupInsert meetupInsert = {
        eventId: uuid:createType1AsString(),
        eventName: formData.get("eventName"),
        eventDescription: formData.get("eventDescription"),
        eventStartDate: formData.get("eventStartDate"),
        eventStartTime: formData.get("eventStartTime"),
        eventEndDate: formData.get("eventEndDate"),
        eventEndTime: formData.get("eventEndTime"),
        venueName: formData.get("venueName"),
        venueGoogleMapsUrl: formData.get("venueGoogleMapsUrl"),
        isPaidEvent: isPaidEvent,
        eventCost: eventCost,
        hasLimitedCapacity: hasLimitedCapacity,
        eventCapacity: eventCapacity,
        requireApproval: requireApproval,
        imageUrl: imageUrl,
        createdAt: time:utcNow().toString()
    };

    sql:ExecutionResult|sql:Error dbResult = insertMeetup(meetupInsert);
    if dbResult is sql:Error {
        return {success: false, message: "Failed to save meetup to database: " + dbResult.message()};
    }

    return {success: true, message: "Event created successfully and saved to database"};
}

public isolated function getAllMeetups() returns MeetupListResponse|error {
    MeetupRecord[]|sql:Error dbResult = dbGetAllMeetups();
    if dbResult is sql:Error {
        return {success: false, message: "Failed to fetch meetups: " + dbResult.message()};
    }

    EventData[] eventDataList = [];
    foreach MeetupRecord meetup in dbResult {
        EventData eventData = {
            eventId: meetup.event_id,
            eventName: meetup.event_name,
            eventDescription: meetup.event_description,
            eventStartDate: meetup.event_start_date,
            eventStartTime: meetup.event_start_time,
            eventEndDate: meetup.event_end_date,
            eventEndTime: meetup.event_end_time,
            venueName: meetup.venue_name,
            venueGoogleMapsUrl: meetup.venue_google_maps_url,
            isPaidEvent: meetup.is_paid_event,
            eventCost: meetup.event_cost,
            hasLimitedCapacity: meetup.has_limited_capacity,
            eventCapacity: meetup.event_capacity,
            requireApproval: meetup.require_approval,
            imageUrl: meetup.image_url,
            createdAt: meetup.created_at
        };
        eventDataList.push(eventData);
    }

    return {success: true, message: "Meetups fetched successfully", data: eventDataList};
}

public isolated function getMeetupById(string eventId) returns MeetupResponse|error {
    MeetupRecord|sql:Error dbResult = dbGetMeetupById(eventId);
    if dbResult is sql:Error {
        return {success: false, message: "Meetup not found"};
    }

    EventData eventData = {
        eventId: dbResult.event_id,
        eventName: dbResult.event_name,
        eventDescription: dbResult.event_description,
        eventStartDate: dbResult.event_start_date,
        eventStartTime: dbResult.event_start_time,
        eventEndDate: dbResult.event_end_date,
        eventEndTime: dbResult.event_end_time,
        venueName: dbResult.venue_name,
        venueGoogleMapsUrl: dbResult.venue_google_maps_url,
        isPaidEvent: dbResult.is_paid_event,
        eventCost: dbResult.event_cost,
        hasLimitedCapacity: dbResult.has_limited_capacity,
        eventCapacity: dbResult.event_capacity,
        requireApproval: dbResult.require_approval,
        imageUrl: dbResult.image_url,
        createdAt: dbResult.created_at
    };

    return {success: true, message: "Meetup fetched successfully", data: eventData};
}

public function updateMeetup(string eventId, EventUpdateRequest updateRequest) returns EventCreationResult|error {
    MeetupUpdate meetupUpdate = {
        eventName: updateRequest.eventName,
        eventDescription: updateRequest.eventDescription,
        eventStartDate: updateRequest.eventStartDate,
        eventStartTime: updateRequest.eventStartTime,
        eventEndDate: updateRequest.eventEndDate,
        eventEndTime: updateRequest.eventEndTime,
        venueName: updateRequest.venueName,
        venueGoogleMapsUrl: updateRequest.venueGoogleMapsUrl,
        isPaidEvent: updateRequest.isPaidEvent,
        eventCost: updateRequest.eventCost,
        hasLimitedCapacity: updateRequest.hasLimitedCapacity,
        eventCapacity: updateRequest.eventCapacity,
        requireApproval: updateRequest.requireApproval,
        imageUrl: ()
    };

    sql:ExecutionResult|sql:Error dbResult = dbUpdateMeetup(eventId, meetupUpdate);
    if dbResult is sql:Error {
        return {success: false, message: "Failed to update meetup: " + dbResult.message()};
    }

    sql:ExecutionResult result = dbResult;
    if result.affectedRowCount == 0 {
        return {success: false, message: "Meetup not found"};
    }

    return {success: true, message: "Meetup updated successfully"};
}

public isolated function deleteMeetup(string eventId) returns EventCreationResult|error {
    sql:ExecutionResult|sql:Error dbResult = dbDeleteMeetup(eventId);
    if dbResult is sql:Error {
        return {success: false, message: "Failed to delete meetup: " + dbResult.message()};
    }

    sql:ExecutionResult result = dbResult;
    if result.affectedRowCount == 0 {
        return {success: false, message: "Meetup not found"};
    }

    return {success: true, message: "Meetup deleted successfully"};
}

isolated function parseDecimal(string? value) returns decimal? {
    if value is string && value != "" {
        decimal|error result = decimal:fromString(value);
        return result is decimal ? result : ();
    }
    return ();
}

isolated function parseInt(string? value) returns int? {
    if value is string && value != "" {
        int|error result = int:fromString(value);
        return result is int ? result : ();
    }
    return ();
}
