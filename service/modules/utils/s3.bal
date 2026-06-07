import ballerina/http;
import ballerina/mime;
import ballerina/regex as re;
import ballerina/time;

configurable string cloudflareApiToken = ?;
configurable string accountId = ?;
configurable string bucketName = ?;
configurable string r2PublicUrl = ?;

final http:Client r2Client = check new ("https://api.cloudflare.com",
    config = {
        timeout: 60
    }
);

final readonly & map<string> imageTypes = {
    "png": "image/png",
    "jpg": "image/jpeg",
    "jpeg": "image/jpeg",
    "gif": "image/gif",
    "webp": "image/webp"
};

public type ImageUploadResult record {
    boolean success;
    string message;
    ImageData? data?;
};

public type ImageData record {
    string filename;
    string r2Path;
    string uploadedAt;
    string url;
};

public type ImageListResult record {
    boolean success;
    string? message?;
    ImageInfo[]? images?;
};

public type ImageInfo record {
    string name;
    string size;
    string lastModified;
    string url;
};

isolated function generateCleanFileName(string originalFileName) returns string {
    string ts = re:replaceAll(time:utcNow().toString(), "[^0-9]", "");
    string[] parts = re:split(originalFileName, "\\.");
    string ext = parts.length() > 1 ? parts[parts.length() - 1] : "jpg";
    return string `${ts}.${ext}`;
}

isolated function getContentType(string fileName) returns string {
    string[] parts = re:split(fileName, "\\.");
    string ext = parts.length() > 1 ? parts[parts.length() - 1].toLowerAscii() : "jpg";
    return imageTypes[ext] ?: "application/octet-stream";
}

isolated function uploadToR2(byte[] imageContent, string objectKey, string ctype) returns error? {
    string path = string `/client/v4/accounts/${accountId}/r2/buckets/${bucketName}/objects/${objectKey}`;

    http:Request uploadReq = new;

    uploadReq.setBinaryPayload(imageContent, contentType = ctype);

    uploadReq.setHeader("Authorization", "Bearer " + cloudflareApiToken);

    http:Response res = check r2Client->put(path, uploadReq);

    if res.statusCode != 200 {
        return error(string `R2 upload failed: ${res.statusCode}`);
    }
}

public isolated function uploadImageToR2(http:Request req) returns ImageUploadResult|error {
    mime:Entity[] bodyParts = check req.getBodyParts();
    byte[] imageContent = [];
    string fileName = "image.jpg";

    foreach mime:Entity part in bodyParts {
        mime:ContentDisposition cd = part.getContentDisposition();
        if cd.name == "image" {
            imageContent = check part.getByteArray();
            string cdFileName = cd.fileName;
            if cdFileName != "" {
                fileName = cdFileName;
            }
        }
    }

    if imageContent.length() == 0 {
        return {success: false, message: "image file not found"};
    }

    string[] parts = re:split(fileName, "\\.");
    if parts.length() < 2 || !imageTypes.hasKey(parts[parts.length() - 1].toLowerAscii()) {
        return {success: false, message: "invalid image type"};
    }

    string key = "uploads/" + generateCleanFileName(fileName);
    check uploadToR2(imageContent, key, getContentType(fileName));

    return {
        success: true,
        message: "image upload success",
        data: {filename: key, r2Path: key, uploadedAt: time:utcNow().toString(), url: string `${r2PublicUrl}/${key}`}
    };
}

public isolated function uploadImageFromPart(mime:Entity part) returns ImageUploadResult|error {
    mime:ContentDisposition cd = part.getContentDisposition();
    string cdFileName = cd.fileName;
    string fileName = cdFileName != "" ? cdFileName : "image.jpg";
    byte[] imageContent = check part.getByteArray();

    if imageContent.length() == 0 {
        return {success: false, message: "image content is empty"};
    }

    string[] parts = re:split(fileName, "\\.");
    if parts.length() < 2 || !imageTypes.hasKey(parts[parts.length() - 1].toLowerAscii()) {
        return {success: false, message: "invalid image type"};
    }

    string key = "uploads/" + generateCleanFileName(fileName);
    check uploadToR2(imageContent, key, getContentType(fileName));

    return {
        success: true,
        message: "image uploaded successfully",
        data: {filename: key, r2Path: key, uploadedAt: time:utcNow().toString(), url: string `${r2PublicUrl}/${key}`}
    };
}

public isolated function listImagesFromR2() returns ImageListResult|error {
    string path = string `/client/v4/accounts/${accountId}/r2/buckets/${bucketName}/objects?prefix=uploads/`;
    map<string|string[]> headers = {"Authorization": "Bearer " + cloudflareApiToken};
    http:Response res = check r2Client->get(path, headers);
    json payload = check res.getJsonPayload();
    json resultJson = check payload.result;
    json[]|error objectsResult = resultJson.ensureType();
    json[] objects = objectsResult is json[] ? objectsResult : [];

    ImageInfo[] images = [];
    foreach json obj in objects {
        json keyJson = check obj.key;
        json sizeJson = check obj.size;
        json lastModJson = check obj.last_modified;
        string objKey = keyJson.toString();
        images.push({
            name: objKey,
            size: sizeJson.toString(),
            lastModified: lastModJson.toString(),
            url: string `${r2PublicUrl}/${objKey}`
        });
    }
    return {success: true, images: images};
}
