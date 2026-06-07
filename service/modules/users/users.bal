import ballerina/sql;
import ballerina/time;

public isolated function createOrUpdateUser(UserCreateRequest userRequest) returns UserResponse|error {
    string currentTime = time:utcNow().toString();

    UserRecord|sql:Error existingUser = dbGetUserById(userRequest.userId);

    if existingUser is UserRecord {
        // Preserve existing values if incoming fields are missing or empty
        string resolvedFirstName = userRequest.firstName == "" ? existingUser.first_name : userRequest.firstName;
        string resolvedLastName = userRequest.lastName == "" ? existingUser.last_name : userRequest.lastName;
        string? resolvedCountry = let string? c = userRequest?.country in (c is string && c != "" ? c : existingUser.country);
        string? resolvedMobile = let string? m = userRequest?.mobileNumber in (m is string && m != "" ? m : existingUser.mobile_number);
        string? resolvedBirthdate = let string? b = userRequest?.birthdate in (b is string && b != "" ? b : existingUser.birthdate);
        string? resolvedCityName = let string? cn = userRequest?.cityName in (cn is string && cn != "" ? cn : existingUser.city_name);
        float? resolvedCityLat = let float? lat = userRequest?.cityLatitude in (lat is float ? lat : existingUser.city_latitude);
        float? resolvedCityLng = let float? lng = userRequest?.cityLongitude in (lng is float ? lng : existingUser.city_longitude);

        UserUpdate userUpdate = {
            firstName: resolvedFirstName,
            lastName: resolvedLastName,
            country: resolvedCountry,
            mobileNumber: resolvedMobile,
            birthdate: resolvedBirthdate,
            bio: existingUser.bio,
            cityName: resolvedCityName,
            cityLatitude: resolvedCityLat,
            cityLongitude: resolvedCityLng,
            updatedAt: currentTime
        };

        sql:ExecutionResult|sql:Error updateResult = dbUpdateUser(userRequest.userId, userUpdate);
        if updateResult is sql:Error {
            return {success: false, message: "Failed to update user: " + updateResult.message()};
        }

        UserRecord|sql:Error updatedUser = dbGetUserById(userRequest.userId);
        if updatedUser is sql:Error {
            return {success: false, message: "Failed to fetch updated user"};
        }

        User userData = mapUserRecordToUser(updatedUser);
        return {success: true, message: "User updated successfully", data: userData};
    } else {
        UserInsert userInsert = {
            userId: userRequest.userId,
            username: userRequest.username,
            firstName: userRequest.firstName,
            lastName: userRequest.lastName,
            email: userRequest.email,
            country: userRequest?.country,
            mobileNumber: userRequest?.mobileNumber,
            birthdate: userRequest?.birthdate,
            cityName: userRequest?.cityName,
            cityLatitude: userRequest?.cityLatitude,
            cityLongitude: userRequest?.cityLongitude,
            createdAt: currentTime,
            updatedAt: currentTime
        };

        sql:ExecutionResult|sql:Error insertResult = dbInsertUser(userInsert);
        if insertResult is sql:Error {
            return {success: false, message: "Failed to create user: " + insertResult.message()};
        }

        UserRecord|sql:Error newUser = dbGetUserById(userRequest.userId);
        if newUser is sql:Error {
            return {success: false, message: "Failed to fetch created user"};
        }

        User userData = mapUserRecordToUser(newUser);
        return {success: true, message: "User created successfully", data: userData};
    }
}

public isolated function updateUserProfile(string userId, UserUpdateRequest updateRequest) returns UserResponse|error {
    string currentTime = time:utcNow().toString();

    UserRecord|sql:Error existingUser = dbGetUserById(userId);
    if existingUser is sql:Error {
        return {success: false, message: "User not found"};
    }

    UserUpdate userUpdate = {
        firstName: updateRequest?.firstName ?: existingUser.first_name,
        lastName: updateRequest?.lastName ?: existingUser.last_name,
        country: updateRequest?.country ?: existingUser.country,
        mobileNumber: updateRequest?.mobileNumber ?: existingUser.mobile_number,
        birthdate: updateRequest?.birthdate ?: existingUser.birthdate,
        bio: updateRequest?.bio ?: existingUser.bio,
        cityName: updateRequest?.cityName ?: existingUser.city_name,
        cityLatitude: updateRequest?.cityLatitude ?: existingUser.city_latitude,
        cityLongitude: updateRequest?.cityLongitude ?: existingUser.city_longitude,

        updatedAt: currentTime
    };

    sql:ExecutionResult|sql:Error updateResult = dbUpdateUser(userId, userUpdate);
    if updateResult is sql:Error {
        return {success: false, message: "Failed to update user profile: " + updateResult.message()};
    }

    UserRecord|sql:Error updatedUser = dbGetUserById(userId);
    if updatedUser is sql:Error {
        return {success: false, message: "Failed to fetch updated user"};
    }

    User userData = mapUserRecordToUser(updatedUser);
    return {success: true, message: "User profile updated successfully", data: userData};
}

public isolated function getAllUsers() returns UserListResponse|error {
    UserRecord[]|sql:Error dbResult = dbGetAllUsers();
    if dbResult is sql:Error {
        return {success: false, message: "Failed to fetch users: " + dbResult.message()};
    }
    User[] users = from UserRecord r in dbResult
        select mapUserRecordToUser(r);
    return {success: true, message: "Users fetched successfully", data: users};
}

public isolated function getUserById(string userId) returns UserResponse|error {
    UserRecord|sql:Error dbResult = dbGetUserById(userId);
    if dbResult is sql:Error {
        return {success: false, message: "User not found"};
    }

    User userData = mapUserRecordToUser(dbResult);
    return {success: true, message: "User fetched successfully", data: userData};
}

isolated function mapUserRecordToUser(UserRecord userRecord) returns User {
    return {
        userId: userRecord.user_id,
        username: userRecord.username,
        firstName: userRecord.first_name,
        lastName: userRecord.last_name,
        email: userRecord.email,
        country: userRecord.country,
        mobileNumber: userRecord.mobile_number,
        birthdate: userRecord.birthdate,
        bio: userRecord.bio,
        cityName: userRecord.city_name,
        cityLatitude: userRecord.city_latitude,
        cityLongitude: userRecord.city_longitude,
        createdAt: userRecord.created_at,
        updatedAt: userRecord.updated_at
    };
}
