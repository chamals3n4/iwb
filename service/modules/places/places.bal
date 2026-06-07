import 'service.utils;

import ballerina/http;
import ballerina/io;
import ballerina/mime;
import ballerina/regex;
import ballerina/sql;
import ballerina/time;
import ballerina/uuid;

public isolated function createPlace(http:Request req) returns PlaceCreationResult|error {
    mime:Entity[]|http:ClientError bodyParts = req.getBodyParts();
    if bodyParts is error {
        return {success: false, message: "Error parsing multipart data"};
    }

    map<string> formData = {};
    string[] photoUrls = [];

    foreach mime:Entity part in bodyParts {
        mime:ContentDisposition contentDisposition = part.getContentDisposition();
        string partName = contentDisposition.name;

        if partName.startsWith("photo") && photoUrls.length() < 3 {
            // Handle individual photo upload
            utils:ImageUploadResult|error uploadResult = utils:uploadImageFromPart(part);
            if uploadResult is utils:ImageUploadResult && uploadResult.success {
                utils:ImageData? imageData = uploadResult?.data;
                if imageData is utils:ImageData {
                    photoUrls.push(imageData.url);
                }
            } else {
                // Log upload error
                if uploadResult is utils:ImageUploadResult {
                    io:println("Image upload failed: " + uploadResult.message);
                } else {
                    io:println("Image upload error: " + uploadResult.message());
                }
            }
        } else {
            string|error textContent = part.getText();
            if textContent is string {
                formData[partName] = textContent;
            }
        }
    }

    string[] requiredFields = [
        "name",
        "location",
        "googleMapsUrl",
        "price",
        "currency",
        "billing",
        "capacity"
    ];

    foreach string reqField in requiredFields {
        if !formData.hasKey(reqField) || formData[reqField] == "" {
            return {success: false, message: "Missing required field: " + reqField};
        }
    }

    decimal|error price = decimal:fromString(formData.get("price"));
    if price is error {
        return {success: false, message: "Invalid price format"};
    }

    string workspaceTypesStr = formData["workspaceTypes"] ?: "";
    string amenitiesStr = formData["amenities"] ?: "";

    PlaceInsert placeInsert = {
        placeId: uuid:createType1AsString(),
        name: formData.get("name"),
        location: formData.get("location"),
        googleMapsUrl: formData.get("googleMapsUrl"),
        price: price,
        currency: formData.get("currency"),
        billing: formData.get("billing"),
        capacity: formData.get("capacity"),
        workspaceTypes: workspaceTypesStr,
        amenities: amenitiesStr,
        phone: formData.get("phone"),
        email: formData.get("email"),
        website: formData.get("website"),
        photoUrls: photoUrls.length() > 0 ? string:'join(",", ...photoUrls) : "",
        createdAt: time:utcNow().toString()
    };

    sql:ExecutionResult|sql:Error dbResult = insertPlace(placeInsert);
    if dbResult is sql:Error {
        return {success: false, message: "Failed to save place to database: " + dbResult.message()};
    }

    // Log successful creation
    io:println(string `Place created successfully with ${photoUrls.length()} photos`);

    return {success: true, message: "Place created successfully"};
}

public isolated function getAllPlaces() returns PlaceListResponse|error {
    PlaceRecord[]|sql:Error dbResult = getAllPlacesFromDb();
    if dbResult is sql:Error {
        return {success: false, message: "Failed to fetch places: " + dbResult.message()};
    }
    Place[] places = from PlaceRecord r in dbResult
        select mapPlaceRecordToPlace(r);
    return {success: true, message: "Places fetched successfully", data: places};
}

public isolated function getPlaceById(string placeId) returns PlaceResponse|error {
    PlaceRecord|sql:Error dbResult = getPlaceByIdFromDb(placeId);
    if dbResult is sql:Error {
        return {success: false, message: "Place not found"};
    }

    Place place = mapPlaceRecordToPlace(dbResult);
    return {success: true, message: "Place fetched successfully", data: place};
}

public isolated function deletePlace(string placeId) returns PlaceCreationResult|error {
    sql:ExecutionResult|sql:Error dbResult = deletePlaceFromDb(placeId);
    if dbResult is sql:Error {
        return {success: false, message: "Failed to delete place: " + dbResult.message()};
    }
    if dbResult.affectedRowCount == 0 {
        return {success: false, message: "Place not found"};
    }
    return {success: true, message: "Place deleted successfully"};
}

isolated function mapPlaceRecordToPlace(PlaceRecord placeRecord) returns Place {
    string[] workspaceTypes = placeRecord.workspace_types != "" ?
        regex:split(placeRecord.workspace_types, ",") : [];

    string[] amenities = placeRecord.amenities != "" ?
        regex:split(placeRecord.amenities, ",") : [];

    string[]? photoUrls = placeRecord.photo_urls is string ?
        regex:split(<string>placeRecord.photo_urls, ",") : ();

    return {
        placeId: placeRecord.place_id,
        name: placeRecord.name,
        location: placeRecord.location,
        googleMapsUrl: placeRecord.google_maps_url,
        pricing: {
            price: placeRecord.price,
            currency: placeRecord.currency,
            billing: placeRecord.billing
        },
        capacity: placeRecord.capacity,
        workspaceTypes: workspaceTypes,
        amenities: amenities,
        phone: placeRecord.phone,
        email: placeRecord.email,
        website: placeRecord.website,
        photoUrls: photoUrls,
        createdAt: placeRecord.created_at
    };
}

