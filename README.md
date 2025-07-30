# API Automation & DB Validation Framework

This repository contains an automated testing framework that validates APIs and their related database outputs. It is designed to verify end-to-end data integrity by comparing responses from API endpoints against the corresponding data stored in the database.

# Overview

- Executes API requests (GET/POST/PUT/DELETE) and captures responses.
- Performs backend database queries for validation.
- Compares API output with database records.
- Generates detailed pass/fail reports highlighting mismatches.

# Features

- **API Validation**  
  - Supports RESTful API endpoints.  
  - Validates payload, status codes, headers, and response schema.  

- **Database Validation**  
  - Executes SQL queries (select, stored procedure results, views).  
  - Compares API response data with DB values for consistency.

- **Configurable**  
  - Easily add or update API endpoints and SQL query pairs.  
  - Supports multiple environments (QA, staging, production).

- **Automated Reporting**  
  - Generates execution logs and validation summaries.  
  - Clear messaging for mismatches and failures.

# Example Test Flow
1. Send GET API request: Save the api response in json file: APIAutomation\jsonFiles\onpremGetApiResponse.json
2. Send ON PREMISE POST API Request: Use above Json file as request body to this POST API and save api response in json file: APIAutomation\jsonFiles\onpremPostApiResponse.json
3. Send AWS POST API Request: Use above Json file as request body to this POST API and save api response in json file: APIAutomation\jsonFiles\awsPostApiResponse.json
4. Compare the ON PREMISE and AWS API responses. (Use API Mappings to perform attribute to attribute mapping between ONPREMISE and AWS API)
5. Query to ON PREMISE Database: Save it in global variable
6. Query to AWS Database: Save it in global variable
7. Compare the ON PREMISE and AWS database records. (Use DBMappings to store the key comparison)
