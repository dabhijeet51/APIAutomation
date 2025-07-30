import { expect, test } from "@playwright/test";
import * as fs from "fs";
import * as dotenv from "dotenv";
import { MongoClient } from "mongodb";

dotenv.config();

// Storing them in variables to compare
let onPremData: any;
let awsData: any;

// Defining the fields we want to compare along with their mappings
const fieldMapping: Record<string, [string, string]> = {
  applicationId: ["appId", "appId"],
  documentNumber: ["docNo", "documentNo"],
  documentType: ["docType", "docType"],
  documentName: ["docName", "docName"],
  format: ["format", "format"],
  status: ["status", "status"],
  templateId: ["templateId", "templateId"],
  uploadComplete: ["uploadComplete", "uploadComplete"],
  objectId: ["objectId", "objectId"],
};

function compareMappedFields(
  onPremData: Record<string, any>,
  awsData: Record<string, any>,
  fieldMapping: Record<string, [string, string]>
) {
  for (const [fieldLabel, [onPremKey, awsKey]] of Object.entries(
    fieldMapping
  )) {
    const onPremValue = onPremData?.[onPremKey];
    const awsValue = awsData?.[awsKey];

    console.log(
      `Comparing ${fieldLabel}: onPrem(${onPremKey}) = ${onPremValue}, aws(${awsKey}) = ${awsValue}`
    );

    expect(onPremValue).toBeDefined();
    expect(awsValue).toBeDefined();
    expect(onPremValue).toEqual(awsValue);
  }
}

test("Compare AWS DB Data", async () => {
  test.setTimeout(60000);

  const {
    AWS_DEV_DBHOST,
    AWS_DEV_USERNAME,
    AWS_DEV_PASSWORD,
  } = process.env;

  const rawPemPath = process.env.AWS_DEV_PEMPATH;
  if (!rawPemPath) throw new Error("rawPemPath is undefined");
  if (!fs.existsSync(rawPemPath)) throw new Error("File Not Found");

  const pemPath = rawPemPath.replace(/\\/g, "/");

  const awsUri = `mongodb://${AWS_DEV_USERNAME}:${AWS_DEV_PASSWORD}@${AWS_DEV_DBHOST}/?authMechanism=DEFAULT&tls=true`;
  const client = new MongoClient(awsUri, {
    tls: true,
    tlsCAFile: rawPemPath,
  });

  await client.connect();
  const db = client.db("aws_db");
  const collection = await db.collection("AWS_DOCUMENT");
  const transactionIdValue = process.env.AWS_TRANSACTION_ID;

  awsData = await collection.findOne({
    transactionId: transactionIdValue,
    docType: "Test",
  });

  console.log("This is the result : ", awsData);
  await client.close();
});

test("Compare Data Between On-Prem and AWS Document DB", () => {
  expect(onPremData).toBeTruthy();
  expect(awsData).toBeTruthy();
  compareMappedFields(onPremData, awsData, fieldMapping);
});
