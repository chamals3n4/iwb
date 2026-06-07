import 'service.utils;

import ballerina/log;
import ballerina/sql;

public isolated function dbInsertUser(UserInsert userData) returns sql:ExecutionResult|sql:Error {
    return utils:dbClient->execute(`
        INSERT INTO users (
            user_id, username, first_name, last_name, email,
            country, mobile_number, birthdate, city_name, city_latitude, city_longitude,
            created_at, updated_at
        ) VALUES (
            ${userData.userId}, ${userData.username}, ${userData.firstName},
            ${userData.lastName}, ${userData.email}, ${userData.country},
            ${userData.mobileNumber}, ${userData.birthdate},
            ${userData.cityName}, ${userData.cityLatitude}, ${userData.cityLongitude},
            ${userData.createdAt}, ${userData.updatedAt}
        )
    `);
}

public isolated function dbGetUserById(string userId) returns UserRecord|sql:Error {
    log:printInfo("getUserById: " + userId);
    UserRecord|sql:Error result = utils:dbClient->queryRow(`
        SELECT user_id, username, first_name, last_name, email,
               country, mobile_number, birthdate, bio,
               city_name, city_latitude, city_longitude,
               created_at, updated_at
        FROM users WHERE user_id = ${userId}
    `);
    if result is sql:Error {
        log:printError("DB query failed for userId: " + userId + " - " + result.message());
    }
    return result;
}

public isolated function dbGetAllUsers() returns UserRecord[]|sql:Error {
    stream<UserRecord, sql:Error?> s = utils:dbClient->query(`
        SELECT user_id, username, first_name, last_name, email,
               country, mobile_number, birthdate, bio,
               city_name, city_latitude, city_longitude,
               created_at, updated_at
        FROM users ORDER BY first_name ASC, last_name ASC
    `);
    return from UserRecord user in s
        select user;
}

public isolated function dbUpdateUser(string userId, UserUpdate updateData) returns sql:ExecutionResult|sql:Error {
    return utils:dbClient->execute(`
        UPDATE users SET
            first_name = ${updateData.firstName},
            last_name = ${updateData.lastName},
            country = ${updateData.country},
            mobile_number = ${updateData.mobileNumber},
            birthdate = ${updateData.birthdate},
            bio = ${updateData.bio},
            updated_at = ${updateData.updatedAt},
            city_name = ${updateData.cityName},
            city_latitude = ${updateData.cityLatitude},
            city_longitude = ${updateData.cityLongitude}
        WHERE user_id = ${userId}
    `);
}
