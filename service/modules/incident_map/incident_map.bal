import ballerina/log;
import ballerina/sql;
import ballerina/time;
import ballerina/uuid;
import ballerina/websocket;

// connection registry for incident ws broadcast
isolated class IncidentConnectionRegistry {
    private websocket:Caller[] connections = [];

    isolated function add(websocket:Caller caller) {
        lock {
            self.connections.push(caller);
        }
    }

    isolated function remove(websocket:Caller caller) {
        lock {
            websocket:Caller[] updated = [];
            foreach websocket:Caller conn in self.connections {
                if conn !== caller {
                    updated.push(conn);
                }
            }
            self.connections = updated;
        }
    }

    isolated function broadcast(string messageJson) {
        lock {
            websocket:Caller[] active = [];
            foreach websocket:Caller conn in self.connections {
                websocket:Error? result = conn->writeTextMessage(messageJson);
                if result is websocket:Error {
                    log:printError("failed to send message to client: " + result.message());
                } else {
                    active.push(conn);
                }
            }
            self.connections = active;
            log:printInfo("broadcast new incident to " + active.length().toString() + " clients");
        }
    }
}

final IncidentConnectionRegistry incidentRegistry = new;

listener websocket:Listener incidentListener = new (9091);

isolated service /incidents on incidentListener {
    isolated resource function get .() returns websocket:Service|websocket:UpgradeError {
        log:printInfo("ws upgrade request received for /incidents/");
        return new IncidentWebSocketService();
    }
}

isolated service class IncidentWebSocketService {
    *websocket:Service;

    public isolated function init() {
    }

    remote function onOpen(websocket:Caller caller) returns websocket:Error? {
        incidentRegistry.add(caller);
        log:printInfo("new ws client connected for /incidents");
        return;
    }

    remote function onClose(websocket:Caller caller, int statusCode, string reason) returns websocket:Error? {
        incidentRegistry.remove(caller);
        log:printInfo("ws client disconnected");
        return;
    }

    remote function onError(websocket:Caller caller, websocket:Error err) returns websocket:Error? {
        log:printError("ws error: " + err.message());
        incidentRegistry.remove(caller);
        return;
    }
}

isolated function broadcastIncident(Incident incident) {
    string messageJson = string `{"type":"new_incident","data":${incident.toJsonString()}}`;
    incidentRegistry.broadcast(messageJson);
}

public isolated function createIncident(IncidentCreateRequest incidentRequest) returns IncidentResponse|error {
    string incidentId = uuid:createType1AsString();
    time:Utc now = time:utcNow();
    string currentTime = time:utcToString(now);

    IncidentInsert incidentInsert = {
        incidentId: incidentId,
        userId: incidentRequest.userId,
        incidentType: incidentRequest.'type,
        description: incidentRequest.description,
        latitude: incidentRequest.latitude,
        longitude: incidentRequest.longitude,
        reportedAt: currentTime,
        createdAt: currentTime,
        updatedAt: currentTime
    };

    sql:ExecutionResult|sql:Error dbResult = insertIncident(incidentInsert);
    if dbResult is sql:Error {
        return {success: false, message: "failed to save incident: " + dbResult.message()};
    }

    IncidentRecord|sql:Error createdIncident = getIncidentByIdFromDb(incidentId);
    if createdIncident is sql:Error {
        return {success: false, message: "failed to retrieve created incident"};
    }

    Incident incident = mapIncidentRecordToIncident(createdIncident);
    broadcastIncident(incident);

    notifyNearbyUsers(
            incidentRequest.latitude,
            incidentRequest.longitude,
            incidentRequest.'type,
            incidentRequest.description
    );

    return {success: true, message: "incident created successfully", data: incident};
}

public isolated function getAllIncidents() returns IncidentListResponse|error {
    IncidentRecord[]|sql:Error dbResult = getAllIncidentsFromDb();
    if dbResult is sql:Error {
        return {success: false, message: "failed to fetch incidents: " + dbResult.message()};
    }
    Incident[] incidents = from IncidentRecord r in dbResult
        select mapIncidentRecordToIncident(r);
    return {success: true, message: "incidents fetched successfully", data: incidents};
}

public isolated function getIncidentById(string incidentId) returns IncidentResponse|error {
    IncidentRecord|sql:Error dbResult = getIncidentByIdFromDb(incidentId);
    if dbResult is sql:Error {
        return {success: false, message: "incident not found"};
    }

    Incident incident = mapIncidentRecordToIncident(dbResult);
    return {success: true, message: "incident fetched successfully", data: incident};
}

isolated function mapIncidentRecordToIncident(IncidentRecord r) returns Incident {
    return {
        incidentId: r.incident_id,
        userId: r.user_id,
        incidentType: r.incident_type,
        description: r.description,
        latitude: r.latitude,
        longitude: r.longitude,
        reportedAt: r.reported_at,
        createdAt: r.created_at,
        updatedAt: r.updated_at
    };
}
