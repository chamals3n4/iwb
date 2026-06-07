import ballerina/sql;

public isolated function getAllUsers() returns UserRecord[]|sql:Error {
    stream<UserRecord, sql:Error?> s = dbClient->query(`
        SELECT user_id, username, first_name, last_name, email,
               country, mobile_number, birthdate, bio,
               city_name, city_latitude, city_longitude,
               created_at, updated_at
        FROM users ORDER BY first_name ASC, last_name ASC
    `);
    return from UserRecord user in s
        select user;
}

public type UserRecord record {|
    string user_id;
    string username;
    string first_name;
    string last_name;
    string email;
    string? country;
    string? mobile_number;
    string? birthdate;
    string? bio;
    string? city_name;
    float? city_latitude;
    float? city_longitude;
    string created_at;
    string updated_at;
|};
