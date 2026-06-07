public type MeetupRecord record {|
    string event_id;
    string event_name;
    string event_description;
    string event_start_date;
    string event_start_time;
    string event_end_date;
    string event_end_time;
    string venue_name;
    string venue_google_maps_url;
    boolean is_paid_event;
    decimal? event_cost;
    boolean has_limited_capacity;
    int? event_capacity;
    boolean require_approval;
    string? image_url;
    string created_at;
|};

public type MeetupInsert record {|
    string eventId;
    string eventName;
    string eventDescription;
    string eventStartDate;
    string eventStartTime;
    string eventEndDate;
    string eventEndTime;
    string venueName;
    string venueGoogleMapsUrl;
    boolean isPaidEvent;
    decimal? eventCost;
    boolean hasLimitedCapacity;
    int? eventCapacity;
    boolean requireApproval;
    string? imageUrl;
    string createdAt;
|};

public type MeetupUpdate record {|
    string eventName;
    string eventDescription;
    string eventStartDate;
    string eventStartTime;
    string eventEndDate;
    string eventEndTime;
    string venueName;
    string venueGoogleMapsUrl;
    boolean isPaidEvent;
    decimal? eventCost;
    boolean hasLimitedCapacity;
    int? eventCapacity;
    boolean requireApproval;
    string? imageUrl;
|};
