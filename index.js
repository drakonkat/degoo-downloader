import {request} from 'graphql-request'
import fetch from 'node-fetch';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

const url = 'https://production-appsync.degoo.com/graphql';
const refreshTokenCode = process.env.REFRESH_TOKEN;

async function refreshToken() {
    const url = 'https://rest-api.degoo.com/access-token/v2';
    const body = {
        "RefreshToken": refreshTokenCode
    };

    const options = {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(body)
    };

    const response = await fetch(url, options);
    const data = await response.json();

    return data.AccessToken;
}

let headers = {
    "host": "production-appsync.degoo.com",
    "Accept": "*/*",
    "Sec-GPC": "1",
    "sec-ch-ua": '"Not_A Brand";v="8", "Chromium";v="120", "Brave";v="120"',
    "x-api-key": "da2-vs6twz5vnjdavpqndtbzg3prra",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "content-type": "application/json",
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": '"Windows"'
}

let token = await refreshToken();
let limit = 100
let order = 3
let parentID = "-1"
let getFileChildren5 = "query GetFileChildren5(    $Token: String!    $ParentID: String    $AllParentIDs: [String]    $Limit: Int!    $Order: Int!    $NextToken: String  ) {    getFileChildren5(      Token: $Token      ParentID: $ParentID      AllParentIDs: $AllParentIDs      Limit: $Limit      Order: $Order      NextToken: $NextToken    ) {      Items {        ID        MetadataID        UserID        DeviceID        MetadataKey        Name        FilePath        LocalPath        LastUploadTime        LastModificationTime        ParentID        Category        Size        Platform        URL        ThumbnailURL        CreationTime        IsSelfLiked        Likes        IsHidden        IsInRecycleBin        Description        Location2 {          Country          Province          Place          GeoLocation {            Latitude            Longitude          }        }        Data        DataBlock        CompressionParameters        Shareinfo {          Status          ShareTime        }        ShareInfo {          Status          ShareTime        }        Distance        OptimizedURL        Country        Province        Place        GeoLocation {          Latitude          Longitude        }        Location        IsShared        ShareTime      }      NextToken    }  }";
let getOverlay4 = "query GetOverlay4($Token: String!, $ID: IDType!) {    getOverlay4(Token: $Token, ID: $ID) {      ID      MetadataID      UserID      DeviceID      MetadataKey      Name      FilePath      LocalPath      LastUploadTime      LastModificationTime      ParentID      Category      Size      Platform      URL      ThumbnailURL      CreationTime      IsSelfLiked      Likes      Comments      IsHidden      IsInRecycleBin      Description      Location {        Country        Province        Place        GeoLocation {          Latitude          Longitude        }      }      Location2 {        Country        Region        SubRegion        Municipality        Neighborhood        GeoLocation {          Latitude          Longitude        }      }      Data      DataBlock      CompressionParameters      Shareinfo {        Status        ShareTime      }      ShareInfo {        Status        ShareTime      }      HasViewed      QualityScore    }  }";


let result = await request({
    url, document: getFileChildren5, variables: {
        "Token": token,
        "ParentID": parentID,
        "Limit": limit,
        "Order": order
    }, requestHeaders: headers
});

async function downloadFile(id, folderPath) {
    try {
        const variables = {
            Token: token, ID: {
                FileID: id
            }
        };
        const response = await request({
            url,
            document: getOverlay4,
            variables,
            requestHeaders: headers
        });

        const fileUrl = response.getOverlay4.URL;
        const filePath = path.join(folderPath, `${response.getOverlay4.Name}`);

        // Check if file already exists
        if (fs.existsSync(filePath)) {
            console.log(`File ${filePath} already exists. Skipping download.`);
            return;
        }

        const res = await fetch(fileUrl);

        if (!res.ok) {
            throw new Error(`Unexpected response ${res.statusText}`);
        }

        // Ensure the directory exists
        fs.mkdirSync(folderPath, {recursive: true});

        const fileStream = fs.createWriteStream(filePath);

        res.body.pipe(fileStream);

        await new Promise((resolve, reject) => {
            fileStream.on('finish', resolve);
            fileStream.on('error', reject);
        });
        console.log(`File downloaded successfully to ${filePath}`);
    } catch (e) {
        console.error("Error downloading file", e);
        fs.appendFileSync('error.log', `Failed to download file with ID ${id} and name ${response?.getOverlay4?.Name}: ${e}\n`);
    }
}

async function inspectFolder(parentID, folderPath = './downloads', toDownload = false) {
    let result = await request({
        url,
        document: getFileChildren5,
        variables: {
            "Token": token,
            "ParentID": parentID,
            "Limit": limit,
            "Order": order
        },
        requestHeaders: headers
    });

    let totalSize = 0;

    for (let i = 0; i < result.getFileChildren5.Items.length; i++) {

        totalSize += parseInt(result.getFileChildren5.Items[i].Size);

        if (result.getFileChildren5.Items[i].Category == 1 || result.getFileChildren5.Items[i].Category == 2) {
            console.log("Name: ", result.getFileChildren5.Items[i].Name, " ID: ", result.getFileChildren5.Items[i].ID, " Category: ", result.getFileChildren5.Items[i].Category, " Size: ", result.getFileChildren5.Items[i].Size, " CreationTime: ", result.getFileChildren5.Items[i].CreationTime, " IsShared: ", result.getFileChildren5.Items[i].IsShared, " ShareTime: ", result.getFileChildren5.Items[i].ShareTime);
            const newFolderPath = path.join(folderPath, result.getFileChildren5.Items[i].Name);
            totalSize += parseInt(await inspectFolder(result.getFileChildren5.Items[i].ID, newFolderPath, toDownload));
        } else {
            if (toDownload) {
                await downloadFile(result.getFileChildren5.Items[i].ID, folderPath);
            }

        }
    }

    console.log("Total size of folder with ID", parentID, "is", totalSize);
    return totalSize;
}


await inspectFolder("-1", "./downloads", true);

