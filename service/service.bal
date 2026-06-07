import 'service.chat;
import 'service.city_guide;
import 'service.city_rank;
import 'service.incident_map;
import 'service.jobs;
import 'service.meetups;
import 'service.places;
import 'service.tools;
import 'service.users;

import ballerina/http;
import ballerina/log;

configurable int port = 8080;

@http:ServiceConfig {
    cors: {
        allowOrigins: ["http://localhost:3000"],
        allowCredentials: false,
        allowHeaders: ["CORELATION_ID", "Content-Type", "Authorization"],
        allowMethods: ["GET", "POST", "PUT", "DELETE"]
    }
    // auth: [
    //     {
    //         jwtValidatorConfig: {
    //             issuer: "https://api.asgardeo.io/t/s3n4/oauth2/token",
    //             audience: ["9aZBrIolQXX1TKm1ZH8M1gOPQKQa"],
    //             signatureConfig: {
    //                 jwksConfig: {
    //                     url: "https://api.asgardeo.io/t/s3n4/oauth2/jwks"
    //                 }
    //             }
    //         }
    //     }
    // ]
}
service / on new http:Listener(port) {

    // remote jobs
    isolated resource function get api/jobs(string? positionType = (), int? minSalary = (), int? maxSalary = (), string? category = ())
            returns jobs:Job[]|http:BadRequest|http:InternalServerError {

        jobs:JobFilters filters = {minSalary, maxSalary};

        if positionType is string {
            jobs:PositionType|error posType = positionType.ensureType();
            if posType is error {
                return <http:BadRequest>{body: {message: "Invalid position type", details: "Valid values are: Full Time, Part Time, Contract"}};
            }
            filters.positionType = posType;
        }

        if category is string {
            jobs:Category|error cat = category.ensureType();
            if cat is error {
                return <http:BadRequest>{body: {message: "Invalid category", details: "Valid categories are: Administration, Consulting, Customer Success, Design, Development, Education, Finance, Healthcare, Human Resources, Legal, Marketing, Management, Sales, System Administration, Writing"}};
            }
            filters.category = cat;
        }

        jobs:JobFilters & readonly roFilters = <jobs:JobFilters & readonly>filters.cloneReadOnly();
        jobs:Job[]|error jobsResult = jobs:fetchFilteredJobs(roFilters);
        return jobsResult is error ? <http:InternalServerError>{body: {message: "Failed to fetch jobs", details: jobsResult.message()}} : jobsResult;
    }

    // meetups
    isolated resource function get api/meetups() returns json|http:InternalServerError {
        meetups:MeetupListResponse|error result = meetups:getAllMeetups();
        if result is error {
            return <http:InternalServerError>{body: {success: false, message: "Error fetching meetups: " + result.message()}};
        }
        return result.toJson();
    }

    isolated resource function get api/meetups/[string eventId]() returns json|http:NotFound|http:InternalServerError {
        meetups:MeetupResponse|error result = meetups:getMeetupById(eventId);
        if result is error {
            return <http:InternalServerError>{
                body: {success: false, message: "Error fetching meetup: " + result.message()}
            };
        }

        if !result.success {
            return <http:NotFound>{
                body: {success: false, message: result.message}
            };
        }

        return result.toJson();
    }

    isolated resource function delete api/meetups/[string eventId]() returns json|http:NotFound|http:InternalServerError {
        meetups:EventCreationResult|error result = meetups:deleteMeetup(eventId);
        if result is error {
            return <http:InternalServerError>{
                body: {success: false, message: "Error deleting meetup: " + result.message()}
            };
        }

        if !result.success {
            return <http:NotFound>{
                body: result.toJson()
            };
        }

        return result.toJson();
    }

    isolated resource function post event/create(http:Request req) returns json|error {
        meetups:EventCreationResult|error result = meetups:createMeetup(req);
        if result is error {
            return {success: false, message: "Error creating event: " + result.message()};
        }
        return result.toJson();
    }

    // chat ( plex)
    isolated resource function post api/chat(@http:Payload city_guide:UserChatRequest chatRequest)
    returns json|http:BadRequest|http:InternalServerError {

        if chatRequest.message.trim() == "" {
            return <http:BadRequest>{
                body: {success: false, message: "Message cannot be empty"}
            };
        }

        city_guide:CityGuideResponse|error result = city_guide:askAnything(chatRequest.message);
        if result is error {
            return <http:InternalServerError>{
                body: {success: false, message: "Error processing chat request: " + result.message()}
            };
        }

        return result.toJson();
    }

    isolated resource function post api/users(@http:Payload users:UserCreateRequest userRequest)
    returns json|http:BadRequest|http:InternalServerError {

        if userRequest.userId.trim() == "" || userRequest.email.trim() == "" ||
            userRequest.firstName.trim() == "" || userRequest.lastName.trim() == "" {
            return <http:BadRequest>{
                body: {success: false, message: "User ID, email, first name, and last name are required"}
            };
        }

        users:UserResponse|error result = users:createOrUpdateUser(userRequest);
        if result is error {
            return <http:InternalServerError>{
                body: {success: false, message: "Error creating/updating user: " + result.message()}
            };
        }

        return result.toJson();
    }

    isolated resource function get api/users() returns json|http:InternalServerError {
        users:UserListResponse|error result = users:getAllUsers();
        if result is error {
            return <http:InternalServerError>{
                body: {success: false, message: "Error fetching users: " + result.message()}
            };
        }
        return result.toJson();
    }

    isolated resource function get api/users/[string userId]() returns json|http:NotFound|http:InternalServerError {
        users:UserResponse|error result = users:getUserById(userId);
        if result is error {
            return <http:InternalServerError>{
                body: {success: false, message: "Error fetching user: " + result.message()}
            };
        }

        if !result.success {
            return <http:NotFound>{
                body: {success: false, message: result.message}
            };
        }

        return result.toJson();
    }

    isolated resource function put api/users/[string userId](@http:Payload users:UserUpdateRequest updateRequest)
    returns json|http:BadRequest|http:InternalServerError {

        if userId.trim() == "" {
            return <http:BadRequest>{
                body: {success: false, message: "User ID is required"}
            };
        }

        users:UserResponse|error result = users:updateUserProfile(userId, updateRequest);
        if result is error {
            return <http:InternalServerError>{
                body: {success: false, message: "Error updating user profile: " + result.message()}
            };
        }

        return result.toJson();
    }

    // chat api ( chat mean ws not ai chat)
    isolated resource function get api/chat/history/[string meetupId]() returns json|http:NotFound|http:InternalServerError {
        chat:ChatHistoryResponse|error result = chat:getChatHistory(meetupId);
        if result is error {
            return <http:InternalServerError>{
                body: {success: false, message: "Error fetching chat history: " + result.message()}
            };
        }

        if !result.success {
            return <http:NotFound>{
                body: {success: false, message: result.message}
            };
        }

        return result.toJson();
    }

    isolated resource function get api/chat/history/city/[string cityId]() returns json|http:NotFound|http:InternalServerError {
        chat:ChatHistoryResponse|error result = chat:getCityChatHistory(cityId);
        if result is error {
            return <http:InternalServerError>{
                body: {success: false, message: "Error fetching city chat history: " + result.message()}
            };
        }

        if !result.success {
            return <http:NotFound>{
                body: {success: false, message: result.message}
            };
        }

        return result.toJson();
    }

    //mini tools

    isolated resource function get api/weather() returns json|http:InternalServerError {
        tools:WeatherResponse|error result = tools:getCurrentWeather();
        if result is error {
            return <http:InternalServerError>{
                body: {success: false, message: "error fetching weather: " + result.message()}
            };
        }
        return result.toJson();
    }

    isolated resource function get api/convert(decimal amount, string base, string target = "LKR") returns json|http:InternalServerError {
        tools:CurrencyResponse|error result = tools:convertCurrency(amount, base, target);
        if result is error {
            return <http:InternalServerError>{
                body: {success: false, message: "Error converting currency: " + result.message()}
            };
        }
        return result.toJson();
    }

    //places api

    isolated resource function post api/places(http:Request req) returns json|http:BadRequest|http:InternalServerError {
        places:PlaceCreationResult|error result = places:createPlace(req);
        if result is error {
            return <http:InternalServerError>{
                body: {success: false, message: "Error creating place: " + result.message()}
            };
        }

        if !result.success {
            return <http:BadRequest>{
                body: result.toJson()
            };
        }

        return result.toJson();
    }

    isolated resource function get api/places() returns json|http:InternalServerError {
        places:PlaceListResponse|error result = places:getAllPlaces();
        if result is error {
            return <http:InternalServerError>{
                body: {success: false, message: "Error fetching places: " + result.message()}
            };
        }
        return result.toJson();
    }

    isolated resource function get api/places/[string placeId]() returns json|http:NotFound|http:InternalServerError {
        places:PlaceResponse|error result = places:getPlaceById(placeId);
        if result is error {
            return <http:InternalServerError>{
                body: {success: false, message: "Error fetching place: " + result.message()}
            };
        }

        if !result.success {
            return <http:NotFound>
            {
                body: {success: false, message: result.message}
            };
        }
        return result.toJson();
    }

    isolated resource function delete api/places/[string placeId]() returns json|http:NotFound|http:InternalServerError {
        places:PlaceCreationResult|error result = places:deletePlace(placeId);
        if result is error {
            return <http:InternalServerError>
            {
                body: {success: false, message: "Error deleting place: " + result.message()}
            };
        }

        if !result.success {
            return <http:NotFound>{
                body: result.toJson()
            };
        }
        return result.toJson();
    }

    // city rank

    isolated resource function get api/cities() returns json|http:InternalServerError {
        city_rank:CityListResponse|error result = city_rank:getAllCities();
        if result is error {
            return <http:InternalServerError>{
                body: {success: false, message: "Error fetching cities: " + result.message()}
            };
        }
        return result.toJson();
    }

    isolated resource function get api/cities/[string slug]() returns json|http:NotFound|http:InternalServerError {
        city_rank:CityResponse|error result = city_rank:getCityBySlug(slug);
        if result is error {
            return <http:InternalServerError>{
                body: {success: false, message: "Error fetching city: " + result.message()}
            };
        }

        if !result.success {
            return <http:NotFound>{
                body: {success: false, message: result.message}
            };
        }

        return result.toJson();
    }

    isolated resource function post api/cities(http:Request req) returns json|http:BadRequest|http:InternalServerError {
        city_rank:CityCreationResult|error result = city_rank:createCity(req);
        if result is error {
            return <http:InternalServerError>{
                body: {success: false, message: "Error creating city: " + result.message()}
            };
        }

        if !result.success {
            return <http:BadRequest>{
                body: result.toJson()
            };
        }

        return result.toJson();
    }

    isolated resource function post api/cities/[string cityId]/ratings(@http:Payload city_rank:CityRatingRequest ratingRequest)
    returns json|http:BadRequest|http:NotFound|http:InternalServerError {

        if cityId.trim() == "" {
            return <http:BadRequest>{
                body: {success: false, message: "City ID is required"}
            };
        }

        if ratingRequest.userId.trim() == "" {
            return <http:BadRequest>{
                body: {success: false, message: "User ID is required"}
            };
        }

        city_rank:CityRatingResponse|error result = city_rank:submitCityRating(cityId, ratingRequest);
        if result is error {
            return <http:InternalServerError>{
                body: {success: false, message: "Error submitting rating: " + result.message()}
            };
        }

        if !result.success {
            if result.message.includes("not found") {
                return <http:NotFound>{
                    body: {success: false, message: result.message}
                };
            }
            return <http:BadRequest>{
                body: {success: false, message: result.message}
            };
        }

        return result.toJson();
    }

    isolated resource function get api/cities/[string cityId]/chat() returns json|http:NotFound|http:InternalServerError {
        city_rank:CityChatResponse|error result = city_rank:getCityChat(cityId);
        if result is error {
            return <http:InternalServerError>{
                body: {success: false, message: "Error fetching chat messages: " + result.message()}
            };
        }

        if !result.success {
            return <http:NotFound>{
                body: {success: false, message: result.message}
            };
        }

        return result.toJson();
    }

    isolated resource function post api/cities/[string cityId]/chat(@http:Payload city_rank:CityChatRequest chatRequest)
    returns json|http:BadRequest|http:NotFound|http:InternalServerError {

        if cityId.trim() == "" {
            return <http:BadRequest>{
                body: {success: false, message: "City ID is required"}
            };
        }

        if chatRequest.userId.trim() == "" || chatRequest.userName.trim() == "" || chatRequest.message.trim() == "" {
            return <http:BadRequest>{
                body: {success: false, message: "User ID, user name, and message are required"}
            };
        }

        city_rank:CityChatResponse|error result = city_rank:postCityChat(cityId, chatRequest);
        if result is error {
            return <http:InternalServerError>{
                body: {success: false, message: "Error sending chat message: " + result.message()}
            };
        }

        if !result.success {
            if result.message.includes("not found") {
                return <http:NotFound>{
                    body: {success: false, message: result.message}
                };
            }
            return <http:BadRequest>{
                body: {success: false, message: result.message}
            };
        }

        return result.toJson();
    }

    // incidents

    resource function post api/incidents(@http:Payload incident_map:IncidentCreateRequest incidentRequest)
    returns json|http:BadRequest|http:InternalServerError {

        if incidentRequest.userId.trim() == "" || incidentRequest.'type.trim() == "" ||
            incidentRequest.description.trim() == "" {
            return <http:BadRequest>
            {
                body: {success: false, message: "User ID, type, and description are required"}
            };
        }

        incident_map:IncidentResponse|error result = incident_map:createIncident(incidentRequest);
        if result is error {
            return <http:InternalServerError>
            {
                body: {success: false, message: "Error creating incident: " + result.message()}
            };
        }

        return result.toJson();
    }

    isolated resource function get api/incidents() returns json|http:InternalServerError {
        incident_map:IncidentListResponse|error result = incident_map:getAllIncidents();
        if result is error {
            return <http:InternalServerError>
            {
                body: {success: false, message: "Error fetching incidents: " + result.message()}
            };
        }
        return result.toJson();
    }

    isolated resource function get api/incidents/[string incidentId]() returns json|http:NotFound|http:InternalServerError {
        incident_map:IncidentResponse|error result = incident_map:getIncidentById(incidentId);
        if result is error {
            return <http:InternalServerError>
            {
                body: {success: false, message: "Error fetching incident: " + result.message()}
            };
        }

        if !result.success {
            return <http:NotFound>
            {
                body: {success: false, message: result.message}
            };
        }

        return result.toJson();
    }

}

public function main() returns error? {
    log:printInfo("Event Management Service started on port " + port.toString());
    log:printInfo("WebSocket Chat Service started on port 9090");
    log:printInfo("WebSocket Incident Service started on port 9091");

}
