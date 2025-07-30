import { expect, test, APIRequestContext } from "@playwright/test";
import * as fs from "fs";
import dotenv from "dotenv";
import path from "path";
import { compareMappedJsonFields } from "../utils/jsonObjectKeyValueCompare";
import { fieldMapping } from "../dbMappings/firstDbMapping";
import { getOnPremDbData, getAwsDbData } from "../utils/dbhelper";
import { compareMappedFields } from "../utils/dbcompare";
import { initializeApiContext } from "../utils/apihelpers";

let onpremGetContext: APIRequestContext;
let onpremPostContext: APIRequestContext;
let awsQaContext: APIRequestContext;
let onpremtestId;
let awstestId;
let onpremDbData;
let awsDbData;
let onpremReqId;

dotenv.config();

test.describe("This is group of API and DB Validation test cases", () => {
  test.beforeAll(async () => {
    const contexts = await initializeApiContext();
    if (!contexts.onpremQaGetContext) {
      throw new Error("Failed to load ONPREM QA Context");
    }

    onpremGetContext = contexts.onpremQaGetContext;
    onpremPostContext = contexts.onpremQaPostContext;
    awsQaContext = contexts.awsQaPostContext;
  });

  test.afterAll(async () => {
    onpremGetContext.dispose();
    onpremPostContext.dispose();
    awsQaContext.dispose();
  });

  test("API and DB Validation", async ({}, testInfo) => {
    test.setTimeout(120000);

    test.step("1. GET Service Request for ONPREM API", async () => {
      try {
        const gettestId = process.env.ONPREMQA_tst_ID ?? "";
        console.log("This is the gettestIds:", gettestId);

        const queryParams: Record<string, string> = {
          reqId: onpremReqId,
          testId: gettestId,
        };
        console.log("This is the query params:", queryParams);

        const onpremapiResponse = await onpremGetContext.get(
          "/getServiceRequestJson",
          {
            params: queryParams,
            timeout: 90000,
          }
        );

        console.log("Print headers:", onpremapiResponse.headers());
        console.log("This is the ONPREM Response:", onpremapiResponse);
        const onpremData = await onpremapiResponse.json();

        fs.writeFileSync(
          "onpremGetApiResponse.json",
          JSON.stringify(onpremData, null, 2)
        );
        expect(onpremapiResponse.status()).toEqual(200);
      } catch (err) {
        console.error("Error in ONPREM get api call: ", err);
        throw err;
      }
    });

    await test.step("2. POST Service Request for ONPREM API", async () => {
      const fileData = fs.readFileSync('jsonFiles/onpremgetapiresponse.json', 'utf-8');
      const onpremPostApiResponse = await onpremPostContext.post('/serviceRequest', { data: fileData });
      const onpremData = await onpremPostApiResponse.json();
      fs.writeFileSync('jsonFiles/onprempostapiresponse.json', JSON.stringify(onpremData, null, 2));
      onpremtestId = onpremData?.testId;
      expect(onpremPostApiResponse.status()).toEqual(200);
    });

    await test.step("3. POST Service Request for AWS API", async () => {
      const fileData = fs.readFileSync('jsonFiles/onpremgetapiresponse.json', 'utf-8');
      const awsPostResponse = await awsQaContext.post('/orchestration/transform', { data: fileData, });
      const awsData = await awsPostResponse.json();
      fs.writeFileSync('jsonFiles/awspostapiresponse.json', JSON.stringify(awsData, null, 2));
      await testInfo.attach('AWS Post Response', { 
        path: './jsonFiles/awspostapiresponse.json', 
        contentType: 'application/json' 
      });
      awstestId = awsData?.testId;
      expect(awsPostResponse.status()).toEqual(200);
    });

    test("4. Comparison of the ONPREM and AWS JSON files", async () => {
      const mappingFilePath = path.join(
        __dirname,
        "..",
        "apiMappings",
        `${onpremReqId}.json`
      );
      const differences = compareMappedJsonFields(
        "jsonFiles/onpremPostApiResponse.json",
        "jsonFiles/awsPostApiResponse.json",
        mappingFilePath
      );
      expect.soft(differences).toHaveLength(0);
    });

    test.step("5. Get ONPREM DB Data", async () => {
      onpremDbData = await getOnPremDbData(onpremtestId);
      expect.soft(onpremDbData).not.toBeNull();
    });

    await test.step("6. Get AWS DB Data", async () => {
      awsDbData = await getAwsDbData(awstestId, "Test");
      expect.soft(awsDbData).not.toBeNull();
    });

    await test.step("7. Compare ONPREM Data and AWS Data", () => {
      expect(onpremDbData).toBeTruthy();
      expect(awsDbData).toBeTruthy();
      compareMappedFields(onpremDbData, awsDbData, fieldMapping);
    });
  });
});
