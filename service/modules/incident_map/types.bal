public type Incident record {|
    string incidentId;
    string userId;
    string incidentType;
    string description;
    float latitude;
    float longitude;
    string reportedAt;
    string createdAt;
    string updatedAt;
|};

public type IncidentCreateRequest record {|
    string userId;
    string 'type;
    string description;
    float latitude;
    float longitude;
|};

public type IncidentResponse record {|
    boolean success;
    string message;
    Incident? data?;
|};

public type IncidentListResponse record {|
    boolean success;
    string message;
    Incident[]? data?;
|};

public type IncidentRecord record {|
    string incident_id;
    string user_id;
    string incident_type;
    string description;
    float latitude;
    float longitude;
    string reported_at;
    string created_at;
    string updated_at;
|};

public type IncidentInsert record {|
    string incidentId;
    string userId;
    string incidentType;
    string description;
    float latitude;
    float longitude;
    string reportedAt;
    string createdAt;
    string updatedAt;
|};
