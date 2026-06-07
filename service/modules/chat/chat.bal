import ballerina/log;
import ballerina/sql;
import ballerina/time;
import ballerina/uuid;
import ballerina/websocket;

isolated map<websocket:Caller[]> meetupConnections = {};
isolated map<websocket:Caller[]> cityConnections = {};

listener websocket:Listener chatListener = new (9090);

isolated service /chat on chatListener {
    isolated resource function get .() returns websocket:Service|websocket:UpgradeError {
        log:printInfo("WebSocket upgrade request received for /chat/");
        return new ChatWebSocketService();
    }
}

// Each instance is per-connection, so fields are not shared across connections
service class ChatWebSocketService {
    *websocket:Service;
    private string? meetupId = ();
    private string? cityId = ();

    remote function onOpen(websocket:Caller caller) returns websocket:Error? {
        log:printInfo("WebSocket connection opened");
        return;
    }

    remote function onTextMessage(websocket:Caller caller, string text) returns websocket:Error? {
        json|error messageJson = text.fromJsonString();
        if messageJson is error {
            log:printError("Invalid message: " + messageJson.message());
            return;
        }
        WebSocketMessage|error wsMessage = messageJson.cloneWithType();
        if wsMessage is error {
            log:printError("Invalid message format: " + wsMessage.message());
            return;
        }
        if wsMessage.'type == "join" {
            check self.handleJoinRoom(caller, wsMessage.data);
        } else if wsMessage.'type == "message" {
            check self.handleChatMessage(caller, wsMessage.data);
        }
        return;
    }

    remote function onClose(websocket:Caller caller, int statusCode, string reason) returns websocket:Error? {
        if self.meetupId is string {
            removeMeetupConnection(self.meetupId ?: "", caller);
        }
        if self.cityId is string {
            removeCityConnection(self.cityId ?: "", caller);
        }
        log:printInfo("WebSocket connection closed: " + statusCode.toString());
        return;
    }

    remote function onError(websocket:Caller caller, websocket:Error err) returns websocket:Error? {
        log:printError("WebSocket error: " + err.message());
        return;
    }

    private function handleJoinRoom(websocket:Caller caller, json data) returns websocket:Error? {
        JoinRoomMessage|error joinMessage = data.cloneWithType();
        if joinMessage is error {
            log:printError("Invalid join message: " + joinMessage.message());
            return;
        }
        if joinMessage.meetupId is string {
            string meetupIdVal = joinMessage.meetupId ?: "";
            self.meetupId = meetupIdVal;
            addMeetupConnection(meetupIdVal, caller);
            check caller->writeTextMessage(string `{"type":"joined","data":{"meetupId":"${meetupIdVal}","message":"Successfully joined meetup chat"}}`);
            log:printInfo(string `User ${joinMessage.userName} joined meetup ${meetupIdVal}`);
        } else if joinMessage.cityId is string {
            string cityIdVal = joinMessage.cityId ?: "";
            self.cityId = cityIdVal;
            addCityConnection(cityIdVal, caller);
            check caller->writeTextMessage(string `{"type":"joined","data":{"cityId":"${cityIdVal}","message":"Successfully joined city chat"}}`);
            log:printInfo(string `User ${joinMessage.userName} joined city ${cityIdVal}`);
        }
        return;
    }

    private function handleChatMessage(websocket:Caller caller, json data) returns websocket:Error? {
        ChatMessageData|error chatData = data.cloneWithType();
        if chatData is error {
            log:printError("Invalid chat message: " + chatData.message());
            return;
        }
        ChatMessage|error savedMessage = saveChatMessage(chatData);
        if savedMessage is error {
            log:printError("Failed to save chat message: " + savedMessage.message());
            return;
        }
        if chatData.meetupId is string {
            broadcastToMeetup(chatData.meetupId ?: "", savedMessage);
        } else if chatData.cityId is string {
            broadcastToCity(chatData.cityId ?: "", savedMessage);
        }
        return;
    }
}

isolated function addMeetupConnection(string meetupId, websocket:Caller caller) {
    lock {
        meetupConnections[meetupId] = meetupConnections.hasKey(meetupId)
            ? [...meetupConnections.get(meetupId), caller] : [caller];
    }
}

isolated function removeMeetupConnection(string meetupId, websocket:Caller caller) {
    lock {
        if meetupConnections.hasKey(meetupId) {
            websocket:Caller[] updated = meetupConnections.get(meetupId).filter(c => c !== caller);
            if updated.length() > 0 {
                meetupConnections[meetupId] = updated;
            } else {
                _ = meetupConnections.remove(meetupId);
            }
        }
    }
}

isolated function addCityConnection(string cityId, websocket:Caller caller) {
    lock {
        cityConnections[cityId] = cityConnections.hasKey(cityId)
            ? [...cityConnections.get(cityId), caller] : [caller];
    }
}

isolated function removeCityConnection(string cityId, websocket:Caller caller) {
    lock {
        if cityConnections.hasKey(cityId) {
            websocket:Caller[] updated = cityConnections.get(cityId).filter(c => c !== caller);
            if updated.length() > 0 {
                cityConnections[cityId] = updated;
            } else {
                _ = cityConnections.remove(cityId);
            }
        }
    }
}

isolated function broadcastToMeetup(string meetupId, ChatMessage message) {
    string payload = string `{"type":"message","data":${message.toJsonString()}}`;
    lock {
        if meetupConnections.hasKey(meetupId) {
            foreach websocket:Caller conn in meetupConnections.get(meetupId) {
                websocket:Error? err = conn->writeTextMessage(payload);
                if err is websocket:Error {
                    log:printError("Failed to send message: " + err.message());
                }
            }
        }
    }
}

isolated function broadcastToCity(string cityId, ChatMessage message) {
    string payload = string `{"type":"message","data":${message.toJsonString()}}`;
    lock {
        if cityConnections.hasKey(cityId) {
            foreach websocket:Caller conn in cityConnections.get(cityId) {
                websocket:Error? err = conn->writeTextMessage(payload);
                if err is websocket:Error {
                    log:printError("Failed to send message: " + err.message());
                }
            }
        }
    }
}

public isolated function saveChatMessage(ChatMessageData chatData) returns ChatMessage|error {
    string messageId = uuid:createType1AsString();
    string timestamp = time:utcNow().toString();

    if chatData.meetupId is string {
        string meetupIdVal = <string>chatData.meetupId;
        sql:ExecutionResult|sql:Error dbResult = insertChatMessage({
                                                                       messageId,
                                                                       meetupId: meetupIdVal,
                                                                       userId: chatData.userId,
                                                                       userName: chatData.userName,
                                                                       message: chatData.message,
                                                                       createdAt: timestamp
                                                                   });
        if dbResult is sql:Error {
            return error("Failed to save meetup chat message: " + dbResult.message());
        }
        return {
            messageId,
            meetupId: meetupIdVal,
            userId: chatData.userId,
            userName: chatData.userName,
            message: chatData.message,
            timestamp
        };
    } else if chatData.cityId is string {
        string cityIdVal = <string>chatData.cityId;
        sql:ExecutionResult|sql:Error dbResult = insertCityChatMessage({
                                                                           messageId,
                                                                           cityId: cityIdVal,
                                                                           userId: chatData.userId,
                                                                           userName: chatData.userName,
                                                                           message: chatData.message,
                                                                           createdAt: timestamp
                                                                       });
        if dbResult is sql:Error {
            return error("Failed to save city chat message: " + dbResult.message());
        }
        return {
            messageId,
            cityId: cityIdVal,
            userId: chatData.userId,
            userName: chatData.userName,
            message: chatData.message,
            timestamp
        };
    }

    return error("Invalid chat data: neither meetupId nor cityId provided");
}

public isolated function getChatHistory(string meetupId) returns ChatHistoryResponse|error {
    ChatMessageRecord[]|sql:Error dbResult = getChatMessagesByMeetupId(meetupId);
    if dbResult is sql:Error {
        return {success: false, message: "Failed to fetch chat history: " + dbResult.message()};
    }
    ChatMessage[] messages = from ChatMessageRecord r in dbResult
        select {
            messageId: r.message_id,
            meetupId: r?.meetup_id,
            userId: r.user_id,
            userName: r.user_name,
            message: r.message,
            timestamp: r.created_at
        };
    return {success: true, message: "Chat history fetched successfully", data: messages};
}

public isolated function getCityChatHistory(string cityId) returns ChatHistoryResponse|error {
    CityChatMessageRecord[]|sql:Error dbResult = getCityChatMessagesByCityId(cityId);
    if dbResult is sql:Error {
        return {success: false, message: "Failed to fetch city chat history: " + dbResult.message()};
    }
    ChatMessage[] messages = from CityChatMessageRecord r in dbResult
        select {
            messageId: r.message_id,
            cityId: r.city_id,
            userId: r.user_id,
            userName: r.user_name,
            message: r.message,
            timestamp: r.created_at
        };
    return {success: true, message: "City chat history fetched successfully", data: messages};
}
