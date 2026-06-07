import 'service.utils;

import ballerina/sql;

public isolated function insertChatMessage(ChatMessageInsert messageData) returns sql:ExecutionResult|sql:Error {
    return utils:dbClient->execute(`
        INSERT INTO chat_messages (message_id, meetup_id, user_id, user_name, message, created_at)
        VALUES (
            ${messageData.messageId}, ${messageData.meetupId}, ${messageData.userId},
            ${messageData.userName}, ${messageData.message}, ${messageData.createdAt}
        )
    `);
}

public isolated function getChatMessagesByMeetupId(string meetupId) returns ChatMessageRecord[]|sql:Error {
    stream<ChatMessageRecord, sql:Error?> s = utils:dbClient->query(`
        SELECT message_id, meetup_id, user_id, user_name, message, created_at
        FROM chat_messages WHERE meetup_id = ${meetupId} ORDER BY created_at ASC
    `);
    return from ChatMessageRecord msg in s
        select msg;
}

public isolated function insertCityChatMessage(CityChatMessageInsert messageData) returns sql:ExecutionResult|sql:Error {
    return utils:dbClient->execute(`
        INSERT INTO city_chat (message_id, city_id, user_id, user_name, message, created_at)
        VALUES (
            ${messageData.messageId}, ${messageData.cityId}, ${messageData.userId},
            ${messageData.userName}, ${messageData.message}, ${messageData.createdAt}
        )
    `);
}

public isolated function getCityChatMessagesByCityId(string cityId) returns CityChatMessageRecord[]|sql:Error {
    stream<CityChatMessageRecord, sql:Error?> s = utils:dbClient->query(`
        SELECT message_id, city_id, user_id, user_name, message, created_at
        FROM city_chat WHERE city_id = ${cityId} ORDER BY created_at ASC
    `);
    return from CityChatMessageRecord msg in s
        select msg;
}
