import jwt from "jsonwebtoken";
import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import {
  getAzureSqlClient,
  validateAuth0Token,
} from "../common/auth0ValidateToken";
import { logger } from "our-common-packages/dist/logging";
import { LogActions } from "../app.constants";

const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest
): Promise<void> {
  context.res.headers = { "Content-Type": "application/json" };

  const authorizationHeader = req.headers.authorization;

  if (!authorizationHeader) {
    context.res = {
      status: 401,
      body: "Unauthorized: Access denied. Authorization header is missing or token could not be found.",
    };
    return;
  }

  const token = authorizationHeader?.startsWith("Bearer ")
    ? authorizationHeader.slice(7)
    : authorizationHeader || "";

  await validateAuth0Token(token);

  const tokenData: any = jwt.decode(token, { complete: true })?.payload;

  const { azp } = tokenData;

  if (!azp) {
    context.res = {
      status: 401,
      body: "Unauthorized: Access denied. Please provide a valid auth0 client id.",
    };
    return;
  }

  const connection = await getAzureSqlClient();

  try {
    let queryResult = await connection
      .request()
      .input("ClientId", azp)
      .execute("[apidata].[Get_AppRegistration_By_ClientId]"); // Store Procedure

    const appRegResults = queryResult?.recordset || [];

    if (appRegResults.length > 0) {
      queryResult = await connection
        .request()
        .input("CustomerCode", appRegResults[0]?.CustomerCode)
        .execute("[apidata].[Get_ListOfFields_By_CustomerCode]"); //Store Procedure

      logger.info({ key: LogActions.DATAHUB_RESULTS, queryResult });

      const results = queryResult?.recordset || [];

      context.res = {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
        body: results,
      };
    } else {
      context.res = {
        status: 404,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ error: "Client ID not found" }),
      };
    }
  } catch (error) {
    logger.error({
      key: LogActions.API_REGISTRATION_ERROR,
      error: error,
    });
  } finally {
    if (connection) {
      await connection.close();
    }
  }
};

export default httpTrigger;
