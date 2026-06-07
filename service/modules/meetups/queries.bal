import 'service.utils;

import ballerina/sql;

public isolated function insertMeetup(MeetupInsert meetupData) returns sql:ExecutionResult|sql:Error {
    return utils:dbClient->execute(`
        INSERT INTO meetups (
            event_id, event_name, event_description, event_start_date,
            event_start_time, event_end_date, event_end_time, venue_name,
            venue_google_maps_url, is_paid_event, event_cost,
            has_limited_capacity, event_capacity, require_approval,
            image_url, created_at
        ) VALUES (
            ${meetupData.eventId}, ${meetupData.eventName}, ${meetupData.eventDescription},
            ${meetupData.eventStartDate}, ${meetupData.eventStartTime}, ${meetupData.eventEndDate},
            ${meetupData.eventEndTime}, ${meetupData.venueName}, ${meetupData.venueGoogleMapsUrl},
            ${meetupData.isPaidEvent}, ${meetupData.eventCost}, ${meetupData.hasLimitedCapacity},
            ${meetupData.eventCapacity}, ${meetupData.requireApproval}, ${meetupData.imageUrl},
            ${meetupData.createdAt}
        )
    `);
}

public isolated function dbGetMeetupById(string eventId) returns MeetupRecord|sql:Error {
    return utils:dbClient->queryRow(`
        SELECT event_id, event_name, event_description, event_start_date,
               event_start_time, event_end_date, event_end_time, venue_name,
               venue_google_maps_url, is_paid_event, event_cost,
               has_limited_capacity, event_capacity, require_approval,
               image_url, created_at
        FROM meetups WHERE event_id = ${eventId}
    `);
}

public isolated function dbGetAllMeetups() returns MeetupRecord[]|sql:Error {
    stream<MeetupRecord, sql:Error?> s = utils:dbClient->query(`
        SELECT event_id, event_name, event_description, event_start_date,
               event_start_time, event_end_date, event_end_time, venue_name,
               venue_google_maps_url, is_paid_event, event_cost,
               has_limited_capacity, event_capacity, require_approval,
               image_url, created_at
        FROM meetups ORDER BY created_at DESC
    `);
    return from MeetupRecord meetup in s
        select meetup;
}

public isolated function dbUpdateMeetup(string eventId, MeetupUpdate updateData) returns sql:ExecutionResult|sql:Error {
    return utils:dbClient->execute(`
        UPDATE meetups SET
            event_name = ${updateData.eventName},
            event_description = ${updateData.eventDescription},
            event_start_date = ${updateData.eventStartDate},
            event_start_time = ${updateData.eventStartTime},
            event_end_date = ${updateData.eventEndDate},
            event_end_time = ${updateData.eventEndTime},
            venue_name = ${updateData.venueName},
            venue_google_maps_url = ${updateData.venueGoogleMapsUrl},
            is_paid_event = ${updateData.isPaidEvent},
            event_cost = ${updateData.eventCost},
            has_limited_capacity = ${updateData.hasLimitedCapacity},
            event_capacity = ${updateData.eventCapacity},
            require_approval = ${updateData.requireApproval},
            image_url = ${updateData.imageUrl}
        WHERE event_id = ${eventId}
    `);
}

public isolated function dbDeleteMeetup(string eventId) returns sql:ExecutionResult|sql:Error {
    return utils:dbClient->execute(`DELETE FROM meetups WHERE event_id = ${eventId}`);
}
