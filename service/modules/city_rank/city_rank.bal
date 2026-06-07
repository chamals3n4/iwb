import 'service.utils;

import ballerina/http;
import ballerina/io;
import ballerina/mime;
import ballerina/regex;
import ballerina/sql;
import ballerina/time;
import ballerina/uuid;

public isolated function getAllCities() returns CityListResponse|error {
    CityRecord[]|sql:Error dbResult = getAllCitiesFromDb();
    if dbResult is sql:Error {
        return {success: false, message: "Failed to fetch cities: " + dbResult.message()};
    }
    CityBasic[] cities = from CityRecord r in dbResult
        select mapCityRecordToCityBasic(r);
    return {success: true, message: "Cities fetched successfully", data: cities};
}

public isolated function getCityBySlug(string slug) returns CityResponse|error {
    CityRecord|sql:Error cityResult = getCityBySlugFromDb(slug);
    if cityResult is sql:Error {
        return {success: false, message: "City not found"};
    }

    CityRatingAverages|sql:Error ratingsResult = getCityRatingAverages(cityResult.city_id);
    CityRatingBreakdown? ratingsBreakdown = ();
    if ratingsResult is CityRatingAverages {
        ratingsBreakdown = {
            costOfLivingAvg: ratingsResult.cost_of_living_avg,
            safetyAvg: ratingsResult.safety_avg,
            transportationAvg: ratingsResult.transportation_avg,
            healthcareAvg: ratingsResult.healthcare_avg,
            foodAvg: ratingsResult.food_avg,
            nightlifeAvg: ratingsResult.nightlife_avg,
            cultureAvg: ratingsResult.culture_avg,
            outdoorActivitiesAvg: ratingsResult.outdoor_activities_avg
        };
    }

    City city = mapCityRecordToCity(cityResult, ratingsBreakdown);
    return {success: true, message: "City fetched successfully", data: city};
}

public isolated function createCity(http:Request req) returns CityCreationResult|error {
    mime:Entity[]|http:ClientError bodyParts = req.getBodyParts();
    if bodyParts is error {
        return {success: false, message: "Error parsing multipart data"};
    }

    map<string> formData = {};
    string[] imageUrls = [];

    foreach mime:Entity part in bodyParts {
        mime:ContentDisposition contentDisposition = part.getContentDisposition();
        string partName = contentDisposition.name;

        // upload imgs one by one
        if partName.startsWith("image") && imageUrls.length() < 4 {
            utils:ImageUploadResult|error uploadResult = utils:uploadImageFromPart(part);
            if uploadResult is utils:ImageUploadResult && uploadResult.success {
                utils:ImageData? imageData = uploadResult?.data;
                if imageData is utils:ImageData {
                    imageUrls.push(imageData.url);
                }
            } else {
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

    string[] requiredFields = ["name", "province", "description", "category", "latitude", "longitude"];
    foreach string reqField in requiredFields {
        if !formData.hasKey(reqField) || formData[reqField] == "" {
            return {success: false, message: "Missing required field: " + reqField};
        }
    }

    decimal|error latitude = decimal:fromString(formData.get("latitude"));
    if latitude is error {
        return {success: false, message: "Invalid latitude format"};
    }

    decimal|error longitude = decimal:fromString(formData.get("longitude"));
    if longitude is error {
        return {success: false, message: "Invalid longitude format"};
    }

    string slug = generateSlug(formData.get("name"));
    string cityId = uuid:createType1AsString();

    string amenitiesStr = formData["amenities"] ?: "[]";
    json|error amenitiesJson = amenitiesStr.fromJsonString();
    if amenitiesJson is error {
        return {success: false, message: "Invalid amenities JSON format"};
    }

    CityInsert cityInsert = {
        cityId: cityId,
        name: formData.get("name"),
        slug: slug,
        province: formData.get("province"),
        description: formData.get("description"),
        category: formData.get("category"),
        latitude: latitude,
        longitude: longitude,
        costOfLiving: (),
        temperature: (),
        population: (),
        amenities: amenitiesStr,
        imageUrls: imageUrls.length() > 0 ? string:'join(",", ...imageUrls) : "",
        createdAt: time:utcNow().toString(),
        updatedAt: time:utcNow().toString()
    };

    sql:ExecutionResult|sql:Error dbResult = insertCity(cityInsert);
    if dbResult is sql:Error {
        return {success: false, message: "Failed to save city to database: " + dbResult.message()};
    }

    io:println(string `City created successfully with ${imageUrls.length()} images`);
    return {success: true, message: "City created successfully", cityId: cityId};
}

public isolated function submitCityRating(string cityId, CityRatingRequest ratingRequest) returns CityRatingResponse|error {
    RatingData ratings = ratingRequest.ratings;
    int[] ratingValues = [
        ratings.costOfLiving,
        ratings.safety,
        ratings.transportation,
        ratings.healthcare,
        ratings.food,
        ratings.nightlife,
        ratings.culture,
        ratings.outdoorActivities
    ];

    foreach int rating in ratingValues {
        if rating < 1 || rating > 5 {
            return {success: false, message: "All ratings must be between 1 and 5"};
        }
    }

    CityRecord|sql:Error cityResult = getCityByIdFromDb(cityId);
    if cityResult is sql:Error {
        return {success: false, message: "City not found"};
    }

    string ratingId = uuid:createType1AsString();
    CityRatingInsert ratingInsert = {
        ratingId: ratingId,
        cityId: cityId,
        userId: ratingRequest.userId,
        costOfLivingRating: ratings.costOfLiving,
        safetyRating: ratings.safety,
        transportationRating: ratings.transportation,
        healthcareRating: ratings.healthcare,
        foodRating: ratings.food,
        nightlifeRating: ratings.nightlife,
        cultureRating: ratings.culture,
        outdoorActivitiesRating: ratings.outdoorActivities,
        reviewText: ratingRequest?.reviewText,
        createdAt: time:utcNow().toString()
    };

    sql:ExecutionResult|sql:Error ratingResult = insertCityRating(ratingInsert);
    if ratingResult is sql:Error {
        return {success: false, message: "Failed to save rating: " + ratingResult.message()};
    }

    error? updateResult = updateCityOverallRating(cityId);
    if updateResult is error {
        io:println("Warning: Failed to update city overall rating: " + updateResult.message());
    }

    return {success: true, message: "Rating submitted successfully"};
}

public isolated function getCityChat(string cityId) returns CityChatResponse|error {
    CityChatRecord[]|sql:Error dbResult = getCityChatMessagesFromDb(cityId);
    if dbResult is sql:Error {
        return {success: false, message: "Failed to fetch chat messages: " + dbResult.message()};
    }
    CityChatMessage[] messages = from CityChatRecord r in dbResult
        select {
            messageId: r.message_id,
            cityId: r.city_id,
            userId: r.user_id,
            userName: r.user_name,
            message: r.message,
            createdAt: r.created_at
        };
    return {success: true, message: "Chat messages fetched successfully", data: messages};
}

public isolated function postCityChat(string cityId, CityChatRequest chatRequest) returns CityChatResponse|error {
    // Check if city exists
    CityRecord|sql:Error cityResult = getCityByIdFromDb(cityId);
    if cityResult is sql:Error {
        return {success: false, message: "City not found"};
    }

    if chatRequest.message.trim() == "" {
        return {success: false, message: "Message cannot be empty"};
    }

    string messageId = uuid:createType1AsString();
    CityChatInsert chatInsert = {
        messageId: messageId,
        cityId: cityId,
        userId: chatRequest.userId,
        userName: chatRequest.userName,
        message: chatRequest.message,
        createdAt: time:utcNow().toString()
    };

    sql:ExecutionResult|sql:Error dbResult = insertCityChatMessage(chatInsert);
    if dbResult is sql:Error {
        return {success: false, message: "Failed to send message: " + dbResult.message()};
    }

    return {success: true, message: "Message sent successfully"};
}

isolated function generateSlug(string name) returns string {
    string slug = regex:replaceAll(name.toLowerAscii(), "[^a-z0-9]", "-");
    return regex:replaceAll(slug, "-+", "-").trim();
}

isolated function mapCityRecordToCityBasic(CityRecord r) returns CityBasic {
    string[] urls = r.image_urls is string && r.image_urls != "" ? regex:split(<string>r.image_urls, ",") : [];
    return {
        cityId: r.city_id,
        name: r.name,
        slug: r.slug,
        overallRating: r.overall_rating,
        category: r.category,
        description: r.description,
        firstImageUrl: urls.length() > 0 ? urls[0] : (),
        rankPosition: r.rank_position
    };
}

isolated function mapCityRecordToCity(CityRecord r, CityRatingBreakdown? ratingsBreakdown) returns City {
    string[]? amenities = ();
    if r.amenities is string && r.amenities != "" {
        json|error amenitiesJson = (r.amenities ?: "").fromJsonString();
        if amenitiesJson is json[] {
            string[] temp = [];
            foreach json a in amenitiesJson {
                if a is string {
                    temp.push(a);
                }
            }
            amenities = temp;
        }
    }
    string[]? imageUrls = r.image_urls is string && r.image_urls != "" ? regex:split(<string>r.image_urls, ",") : ();
    return {
        cityId: r.city_id,
        name: r.name,
        slug: r.slug,
        province: r.province,
        description: r.description,
        category: r.category,
        latitude: r.latitude,
        longitude: r.longitude,
        costOfLiving: r.cost_of_living,
        temperature: r.temperature,
        population: r.population,
        amenities: amenities,
        imageUrls: imageUrls,
        overallRating: r.overall_rating,
        totalRatings: r.total_ratings,
        rankPosition: r.rank_position,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
        ratingsBreakdown: ratingsBreakdown
    };
}
