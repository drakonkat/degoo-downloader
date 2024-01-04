import {request} from 'graphql-request'
import fetch from 'node-fetch';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

const url = 'https://production-appsync.degoo.com/graphql';
const refreshTokenCode = process.env.REFRESH_TOKEN;
const downloadPath = process.env.DOWNLOAD_PATH ? process.env.DOWNLOAD_PATH : './downloads';

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
let getFileChildren5 = "query GetFileChildren5(    $Token: String!    $ParentID: String    $AllParentIDs: [String]    $Limit: Int!    $Order: Int!    $NextToken: String  ) {    getFileChildren5(      Token: $Token      ParentID: $ParentID      AllParentIDs: $AllParentIDs      Limit: $Limit      Order: $Order      NextToken: $NextToken    ) {      Items {        ID        MetadataID        UserID        DeviceID        MetadataKey        Name        FilePath        LocalPath        LastUploadTime        LastModificationTime        ParentID        Category        Size        Platform        URL        ThumbnailURL        CreationTime        IsSelfLiked        Likes        IsHidden        IsInRecycleBin        Description        Location2 {          Country          Province          Place          GeoLocation {            Latitude            Longitude          }        }        Data        DataBlock        CompressionParameters        Shareinfo {          Status          ShareTime        }        ShareInfo {          Status          ShareTime        }        Distance        OptimizedURL        Country        Province        Place        GeoLocation {          Latitude          Longitude        }        Location        IsShared        ShareTime      }      NextToken    }  }";
let getOverlay4 = "query GetOverlay4($Token: String!, $ID: IDType!) {    getOverlay4(Token: $Token, ID: $ID) {      ID      MetadataID      UserID      DeviceID      MetadataKey      Name      FilePath      LocalPath      LastUploadTime      LastModificationTime      ParentID      Category      Size      Platform      URL      ThumbnailURL      CreationTime      IsSelfLiked      Likes      Comments      IsHidden      IsInRecycleBin      Description      Location {        Country        Province        Place        GeoLocation {          Latitude          Longitude        }      }      Location2 {        Country        Region        SubRegion        Municipality        Neighborhood        GeoLocation {          Latitude          Longitude        }      }      Data      DataBlock      CompressionParameters      Shareinfo {        Status        ShareTime      }      ShareInfo {        Status        ShareTime      }      HasViewed      QualityScore    }  }";
let getSearchContent3 = "query GetSearchContent3(    $Token: String!    $SearchTerm: String!    $Limit: Int!    $NextToken: String  ) {    getSearchContent3(      Token: $Token      SearchTerm: $SearchTerm      Limit: $Limit      NextToken: $NextToken    ) {      Items {        ID        MetadataID        UserID        DeviceID        MetadataKey        Name        FilePath        LocalPath        LastUploadTime        LastModificationTime        ParentID        Category        Size        Platform        URL        ThumbnailURL        CreationTime        IsSelfLiked        Likes        Comments        IsHidden        IsInRecycleBin        Description        Location {          Country          Province          Place          GeoLocation {            Latitude            Longitude          }        }        Location2 {          Country          Region          SubRegion          Municipality          Neighborhood          GeoLocation {            Latitude            Longitude          }        }        Data        DataBlock        CompressionParameters        Shareinfo {          Status          ShareTime        }        ShareInfo {          Status          ShareTime        }        HasViewed        QualityScore      }      NextToken    }  }";


async function downloadFile({ID, Name}, folderPath) {
    let fileName = "";
    try {
        const filePath = path.join(folderPath, `${Name}`);
        fileName = Name;
        // Check if file already exists
        if (fs.existsSync(filePath)) {
            process.stdout.clearLine();
            process.stdout.cursorTo(0);
            process.stdout.write(`File ${filePath} already exists. Skipping download.`);
            return;
        }
        //If process.stdout is at position major than 0, go to new line
        if (process.stdout.cursor > 0) {
            process.stdout.write("\n");
        }
        const variables = {
            Token: token,
            SearchTerm: Name,
            Limit: 1
        };
        const response = await request({
            url,
            document: getSearchContent3,
            variables,
            requestHeaders: headers
        });

        if(response.getSearchContent3.Items.length < 1){
            console.error(`File ${Name} not found`);
            return;
        }
        const file = response.getSearchContent3.Items[0];
        const fileUrl = file.URL;

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
        console.error("Error downloading file " + fileName + ": " + e?.message);
        fs.appendFileSync('error.log', `Failed to download file with ID ${id} and name ${fileName}: ${e}\n`);
    }
}

async function inspectFolder(parentID, folderPath = downloadPath, toDownload = false) {
    let nextToken = null;
    let totalSize = 0;

    do {
        try {
            let result = await request({
                url,
                document: getFileChildren5,
                variables: {
                    "Token": token,
                    "ParentID": parentID,
                    "Limit": limit,
                    "Order": order,
                    "NextToken": nextToken
                },
                requestHeaders: headers
            });

            for (let i = 0; i < result.getFileChildren5.Items.length; i++) {
                totalSize += parseInt(result.getFileChildren5.Items[i].Size);

                if (result.getFileChildren5.Items[i].Category == 1 || result.getFileChildren5.Items[i].Category == 2) {
                    // console.log("Name: ", result.getFileChildren5.Items[i].Name, " ID: ", result.getFileChildren5.Items[i].ID, " Category: ", result.getFileChildren5.Items[i].Category, " Size: ", result.getFileChildren5.Items[i].Size, " CreationTime: ", result.getFileChildren5.Items[i].CreationTime, " IsShared: ", result.getFileChildren5.Items[i].IsShared, " ShareTime: ", result.getFileChildren5.Items[i].ShareTime);
                    const newFolderPath = path.join(folderPath, result.getFileChildren5.Items[i].Name);
                    totalSize += parseInt(await inspectFolder(result.getFileChildren5.Items[i].ID, newFolderPath, toDownload));
                } else {
                    if (toDownload) {
                        await downloadFile(result.getFileChildren5.Items[i], folderPath);
                    }
                }
            }

            nextToken = result.getFileChildren5.NextToken;
        }catch (e) {
            console.warn("No other data")
            nextToken = null;
        }
    } while (nextToken != null && nextToken !== "");

    // console.log("Total size of folder with ID", parentID, "is", totalSize);
    return totalSize;
}

setTimeout(async () => {
    token = await refreshToken();
}, 60000);
await inspectFolder("-1", downloadPath, true);

