import 'service.utils;

import ballerina/sql;

isolated function insertPlace(PlaceInsert d) returns sql:ExecutionResult|sql:Error {
    return utils:dbClient->execute(`
        INSERT INTO places (
            place_id, name, location, google_maps_url, price, currency,
            billing, capacity, workspace_types, amenities, phone,
            email, website, photo_urls, created_at
        ) VALUES (
            ${d.placeId}, ${d.name}, ${d.location}, ${d.googleMapsUrl}, ${d.price}, ${d.currency},
            ${d.billing}, ${d.capacity}, ${d.workspaceTypes}, ${d.amenities}, ${d.phone},
            ${d.email}, ${d.website}, ${d.photoUrls}, ${d.createdAt}
        )
    `);
}

isolated function getAllPlacesFromDb() returns PlaceRecord[]|sql:Error {
    stream<PlaceRecord, sql:Error?> s = utils:dbClient->query(`
        SELECT place_id, name, location, google_maps_url, price, currency,
               billing, capacity, workspace_types, amenities, phone,
               email, website, photo_urls, created_at
        FROM places ORDER BY created_at DESC
    `, PlaceRecord);
    return check from PlaceRecord p in s
        select p;
}

isolated function getPlaceByIdFromDb(string placeId) returns PlaceRecord|sql:Error {
    return utils:dbClient->queryRow(`
        SELECT place_id, name, location, google_maps_url, price, currency,
               billing, capacity, workspace_types, amenities, phone,
               email, website, photo_urls, created_at
        FROM places WHERE place_id = ${placeId}
    `);
}

isolated function deletePlaceFromDb(string placeId) returns sql:ExecutionResult|sql:Error {
    return utils:dbClient->execute(`DELETE FROM places WHERE place_id = ${placeId}`);
}

