import 'service.utils;

import ballerina/sql;

isolated function insertIncident(IncidentInsert d) returns sql:ExecutionResult|sql:Error {
    return utils:dbClient->execute(`
        INSERT INTO incidents (
            incident_id, user_id, incident_type, description, latitude, longitude,
            reported_at, created_at, updated_at
        ) VALUES (
            ${d.incidentId}, ${d.userId}, ${d.incidentType}, ${d.description},
            ${d.latitude}, ${d.longitude},
            ${d.reportedAt}::timestamp, ${d.createdAt}::timestamp, ${d.updatedAt}::timestamp
        )
    `);
}

isolated function getAllIncidentsFromDb() returns IncidentRecord[]|sql:Error {
    stream<IncidentRecord, sql:Error?> s = utils:dbClient->query(`
        SELECT incident_id, user_id, incident_type, description, latitude, longitude,
               reported_at, created_at, updated_at
        FROM incidents ORDER BY created_at DESC
    `, IncidentRecord);
    return check from IncidentRecord i in s
        select i;
}

isolated function getIncidentByIdFromDb(string incidentId) returns IncidentRecord|sql:Error {
    return utils:dbClient->queryRow(`
        SELECT incident_id, user_id, incident_type, description, latitude, longitude,
               reported_at, created_at, updated_at
        FROM incidents WHERE incident_id = ${incidentId}
    `);
}

