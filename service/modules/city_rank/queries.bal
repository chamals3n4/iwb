import 'service.utils;

import ballerina/sql;
import ballerina/time;

isolated function getAllCitiesFromDb() returns CityRecord[]|sql:Error {
    sql:ParameterizedQuery q = `
        SELECT city_id, name, slug, province, description, category, latitude, longitude,
               cost_of_living, temperature, population, amenities, image_urls,
               overall_rating, total_ratings, rank_position, created_at, updated_at
        FROM cities ORDER BY rank_position ASC, overall_rating DESC, name ASC
    `;
    stream<CityRecord, sql:Error?> s = utils:dbClient->query(q, CityRecord);
    return check from CityRecord c in s
        select c;
}

isolated function getCityBySlugFromDb(string slug) returns CityRecord|sql:Error {
    return utils:dbClient->queryRow(`
        SELECT city_id, name, slug, province, description, category, latitude, longitude,
               cost_of_living, temperature, population, amenities, image_urls,
               overall_rating, total_ratings, rank_position, created_at, updated_at
        FROM cities WHERE slug = ${slug}
    `);
}

isolated function getCityByIdFromDb(string cityId) returns CityRecord|sql:Error {
    return utils:dbClient->queryRow(`
        SELECT city_id, name, slug, province, description, category, latitude, longitude,
               cost_of_living, temperature, population, amenities, image_urls,
               overall_rating, total_ratings, rank_position, created_at, updated_at
        FROM cities WHERE city_id = ${cityId}
    `);
}

isolated function insertCity(CityInsert d) returns sql:ExecutionResult|sql:Error {
    return utils:dbClient->execute(`
        INSERT INTO cities (
            city_id, name, slug, province, description, category, latitude, longitude,
            cost_of_living, temperature, population, amenities, image_urls,
            overall_rating, total_ratings, rank_position, created_at, updated_at
        ) VALUES (
            ${d.cityId}, ${d.name}, ${d.slug}, ${d.province}, ${d.description}, ${d.category},
            ${d.latitude}, ${d.longitude}, ${d.costOfLiving}, ${d.temperature}, ${d.population},
            ${d.amenities}, ${d.imageUrls}, 0.0, 0, 0, ${d.createdAt}, ${d.updatedAt}
        )
    `);
}

isolated function insertCityRating(CityRatingInsert d) returns sql:ExecutionResult|sql:Error {
    return utils:dbClient->execute(`
        INSERT INTO city_ratings (
            rating_id, city_id, user_id, cost_of_living_rating, safety_rating,
            transportation_rating, healthcare_rating, food_rating, nightlife_rating,
            culture_rating, outdoor_activities_rating, review_text, created_at
        ) VALUES (
            ${d.ratingId}, ${d.cityId}, ${d.userId}, ${d.costOfLivingRating}, ${d.safetyRating},
            ${d.transportationRating}, ${d.healthcareRating}, ${d.foodRating}, ${d.nightlifeRating},
            ${d.cultureRating}, ${d.outdoorActivitiesRating}, ${d.reviewText}, ${d.createdAt}
        )
    `);
}

isolated function getCityRatingAverages(string cityId) returns CityRatingAverages|sql:Error {
    return utils:dbClient->queryRow(`
        SELECT
            COALESCE(AVG(cost_of_living_rating), 0) as cost_of_living_avg,
            COALESCE(AVG(safety_rating), 0) as safety_avg,
            COALESCE(AVG(transportation_rating), 0) as transportation_avg,
            COALESCE(AVG(healthcare_rating), 0) as healthcare_avg,
            COALESCE(AVG(food_rating), 0) as food_avg,
            COALESCE(AVG(nightlife_rating), 0) as nightlife_avg,
            COALESCE(AVG(culture_rating), 0) as culture_avg,
            COALESCE(AVG(outdoor_activities_rating), 0) as outdoor_activities_avg
        FROM city_ratings WHERE city_id = ${cityId}
    `);
}

isolated function updateCityOverallRating(string cityId) returns error? {
    sql:ExecutionResult|sql:Error result = utils:dbClient->execute(`
        UPDATE cities SET
            overall_rating = (
                SELECT COALESCE(AVG((cost_of_living_rating + safety_rating + transportation_rating +
                                   healthcare_rating + food_rating + nightlife_rating +
                                   culture_rating + outdoor_activities_rating) / 8.0), 0)
                FROM city_ratings WHERE city_id = ${cityId}
            ),
            total_ratings = (SELECT COUNT(*) FROM city_ratings WHERE city_id = ${cityId}),
            updated_at = ${time:utcNow().toString()}
        WHERE city_id = ${cityId}
    `);
    if result is sql:Error {
        return error("Failed to update city overall rating: " + result.message());
    }
}

isolated function getCityChatMessagesFromDb(string cityId) returns CityChatRecord[]|sql:Error {
    stream<CityChatRecord, sql:Error?> s = utils:dbClient->query(`
        SELECT message_id, city_id, user_id, user_name, message, created_at
        FROM city_chat WHERE city_id = ${cityId} ORDER BY created_at ASC
    `, CityChatRecord);
    return check from CityChatRecord m in s
        select m;
}

isolated function insertCityChatMessage(CityChatInsert d) returns sql:ExecutionResult|sql:Error {
    return utils:dbClient->execute(`
        INSERT INTO city_chat (message_id, city_id, user_id, user_name, message, created_at)
        VALUES (${d.messageId}, ${d.cityId}, ${d.userId}, ${d.userName}, ${d.message}, ${d.createdAt})
    `);
}
