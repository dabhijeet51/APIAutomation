import { MongoClient } from "mongodb";
import * as fs from "fs";
import dotenv from "dotenv";
import * as path from "path";
dotenv.config();

export async function getOnPremDbData(onpremTestId: string) {
  const uri = `mongodb://${process.env.ONPREMQA_DBUSERNAME}:${process.env.ONPREMQA_DBPASSWORD}@${process.env.ONPREM_QA_DBHOST}/?auth`;
  const client = new MongoClient(uri);
  await client.connect();
  const onpremDB = client.db("onprem_db");
  const onpremDbData = await onpremDB
    .collection("ONPREM_DOCUMENT")
    .findOne({ testId: onpremTestId });
  const formatType = onpremDbData?.formatType;
  await client.close();
  return { onpremDbData, formatType };
}

export async function getOnpremReqIdDBData(onpremTestId: string) {
  const uri = `mongodb://${process.env.ONPREM_QA_DBUSERNAME}:${process.env.ONPREM_QA_DBPASSWORD}@${process.env.ONPREM_QA_DBHOST}/?auth`;
  const client = new MongoClient(uri);
  await client.connect();
  const onpremDB = client.db("onprem_db");
  const onpremAppIDDBData = await onpremDB
    .collection("ONPREM_REQUEST_MESSAGES")
    .find({ testId: onpremTestId });
  const result = await onpremAppIDDBData.toArray();
  const onpremReqIds = result.map((doc) => doc.header?.applicationId);
  const onpremReqId = onpremReqIds[0];
  console.log("This is the ONPREM Application ID : ", onpremReqId);
  await client.close();
  return onpremReqId;
}

export async function getAwsDbData(awsTestId: string, awsDocType: string) {
  const pemPath = path.resolve(__dirname, "../dataFiles/global-bundle.pem");
  if (!fs.existsSync(pemPath)) throw new Error("File Not Found");
  const awsUri = `mongodb://${process.env.AWS_DEV_USERNAME}:${process.env.AWS_DEV_PASSWORD}@${process.env.AWS_DEV_DBHOST}/`;
  const client = new MongoClient(awsUri, { tls: true, tlsCAFile: pemPath });
  await client.connect();
  const db = client.db("aws_db");
  const collection = await db.collection("AWS_DOCUMENT");

  let awsDbData;

  // Retry mechanism - 5 attempts
  for (let attempt = 0; attempt < 5; attempt++) {
    if (awsDocType != null) {
      awsDbData = await collection.findOne({
        transactionId: awsTestId,
        docType: awsDocType,
      });
    } else {
      awsDbData = await collection.findOne({
        transactionId: awsTestId,
      });
    }

    if (awsDbData) break;

    console.warn(`Retry ${attempt + 1}: AWS document not found. Retrying...`);
    await new Promise((resolve) => setTimeout(resolve, 5000)); // wait 5 sec
  }

  await client.close();

  if (!awsDbData) {
    throw new Error(
      `AWS Document with transactionId=${awsTestId} and docType=${awsDocType} not found after retries`
    );
  }

  return awsDbData;
}
