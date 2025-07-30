import { APIRequestContext, request } from '@playwright/test';
import dotenv from 'dotenv';
dotenv.config();

export async function initializeApiContext(): Promise<{
  onpremQaGetContext: APIRequestContext;
  onpremQaPostContext: APIRequestContext;
  awsQaPostContext: APIRequestContext;
}> {
  const {
    ONPREMQA_API_GET_BASEURL,
    ONPREMQA_API_USERNAME,
    ONPREMQA_API_PASSWORD,
    ONPREMQA_POST_BASEURL,
    AWSQA_API_POST_BASEURL,
    AWSQA_API_USERNAME,
    AWSQA_API_PASSWORD
  } = process.env;

  if (!ONPREMQA_API_GET_BASEURL || !ONPREMQA_API_USERNAME || !ONPREMQA_API_PASSWORD || !ONPREMQA_POST_BASEURL) {
    throw new Error("Missing onprem QA Credentials");
  }
  if (!AWSQA_API_POST_BASEURL || !AWSQA_API_USERNAME || !AWSQA_API_PASSWORD) {
    throw new Error("Missing aws DEV Credentials");
  }

  const onpremAuthHeader = Buffer.from(`${ONPREMQA_API_USERNAME}:${ONPREMQA_API_PASSWORD}`).toString('base64');
  console.log("This is the onpremAuthHeader :", onpremAuthHeader);
  console.log("This is the ONPREMQA_API_GET_BASEURL :", ONPREMQA_API_GET_BASEURL);

  const awsAuthHeader = Buffer.from(`${AWSQA_API_USERNAME}:${AWSQA_API_PASSWORD}`).toString('base64');

  const onpremQaGetContext = await request.newContext({
    baseURL: ONPREMQA_API_GET_BASEURL,
    ignoreHTTPSErrors: true,
    extraHTTPHeaders: {
      'Authorization': `Basic ${onpremAuthHeader}`,
      'Accept': '*/*',
      'User-Agent': 'curl/8.1.2',
    }
  });

  const onpremQaPostContext = await request.newContext({
    baseURL: ONPREMQA_POST_BASEURL,
    ignoreHTTPSErrors: true,
    extraHTTPHeaders: {
      'Authorization': `Basic ${onpremAuthHeader}`,
      'Accept': '*/*',
      'User-Agent': 'curl/8.1.2',
    }
  });

  const awsQaPostContext = await request.newContext({
    baseURL: AWSQA_API_POST_BASEURL,
    ignoreHTTPSErrors: true,
    extraHTTPHeaders: {
      'Authorization': `Basic ${awsAuthHeader}`,
      'Accept': '*/*',
      'User-Agent': 'curl/8.1.2',
    }
  });

  return { onpremQaGetContext, onpremQaPostContext, awsQaPostContext };
}
