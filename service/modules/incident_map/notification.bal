import 'service.utils;

import ballerina/log;
import ballerina/sql;
import ballerinax/twilio;

configurable string apiKey = ?;
configurable string apiSecret = ?;
configurable string accountSid = ?;
configurable string phoneNumber = ?;

twilio:ConnectionConfig twilioConfig = {
    auth: {
        apiKey,
        apiSecret,
        accountSid
    }
};
isolated final twilio:Client twilio = check new (twilioConfig);

public isolated function haversine(float lat1, float lon1, float lat2, float lon2) returns float {
    float earthRadiusKm = 6371.0;

    float dLat = degreesToRadians(lat2 - lat1);
    float dLon = degreesToRadians(lon2 - lon1);

    float lat1Rad = degreesToRadians(lat1);
    float lat2Rad = degreesToRadians(lat2);

    float sinDLat2 = (dLat / 2.0).sin();
    float sinDLon2 = (dLon / 2.0).sin();

    float a = sinDLat2 * sinDLat2 +
            lat1Rad.cos() * lat2Rad.cos() *
            sinDLon2 * sinDLon2;

    float sqrtA = a.sqrt();
    float sqrt1MinusA = (1.0 - a).sqrt();
    float c = 2.0 * float:atan2(sqrtA, sqrt1MinusA);

    return earthRadiusKm * c;
}

isolated function degreesToRadians(float degrees) returns float {
    return degrees * float:PI / 180.0;
}

public isolated function getUsersWithinRadius(float incidentLat, float incidentLon, float radiusKm)
    returns utils:UserRecord[]|error {

    utils:UserRecord[]|sql:Error allUsers = utils:getAllUsers();
    if allUsers is sql:Error {
        return error("failed to fetch users: " + allUsers.message());
    }

    utils:UserRecord[] nearbyUsers = [];

    foreach utils:UserRecord user in allUsers {
        if user.city_latitude is () || user.city_longitude is () || user.mobile_number is () {
            continue;
        }

        float userLat = user.city_latitude ?: 0.0;
        float userLon = user.city_longitude ?: 0.0;

        float distance = haversine(incidentLat, incidentLon, userLat, userLon);

        if distance <= radiusKm {
            nearbyUsers.push(user);
        }
    }

    return nearbyUsers;
}

public isolated function sendSMS(string toNumber, string message) returns error? {
    twilio:CreateMessageRequest messageRequest = {
        To: toNumber,
        From: phoneNumber,
        Body: message
    };

    twilio:Message|error result = twilio->createMessage(messageRequest);

    if result is error {
        log:printError("Failed to send SMS: " + result.message());
        return result;
    }

    log:printInfo("SMS sent successfully to: " + toNumber);
}

public isolated function notifyNearbyUsers(float incidentLat, float incidentLon, string incidentType, string description) {
    worker notificationWorker {
        utils:UserRecord[]|error nearbyUsers = getUsersWithinRadius(incidentLat, incidentLon, 1.0);

        if nearbyUsers is error {
            log:printError("error fetching nearby users: " + nearbyUsers.message());
            return;
        }

        string message = string `incident alert: ${incidentType} reported near your location. ${description}`;

        foreach utils:UserRecord user in nearbyUsers {
            if user.mobile_number is string {
                error? sendResult = sendSMS(user.mobile_number ?: "", message);
                if sendResult is error {
                    log:printError("failed to notify user " + user.user_id + ": " + sendResult.message());
                }
            }
        }

        log:printInfo("notified " + nearbyUsers.length().toString() + " nearby users");
    }
}
