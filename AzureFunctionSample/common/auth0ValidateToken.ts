import jwt, { JwtHeader } from "jsonwebtoken";
import jwksClient from "jwks-rsa";
import {
  APIDATA_SQL_DATABASE_CONFIG,
  NBF_LEEWAY_SECONDS,
  config,
  LogActions,
} from "../app.constants";
import { logger } from "our-common-packages/dist/logging";

import { getSqlClient } from "our-common-integration-packages";
import { runAsyncWithRetry } from "our-common-packages/dist/async-retry/async-retry";
import { ConnectionPool } from "mssql";

export enum TOKEN_ISSUER {
  AUTH0 = "Auth0",
}
export type CommonPayload = {
  [key: string]: any;
  iss?: string | undefined;
  sub?: string | undefined;
  aud?: string | string[] | undefined;
  exp: number;
  nbf?: number | undefined;
  iat: number;
  jti?: string | undefined;
  tid: string;
  nonce: string;
};

type AzureToken = {
  payload: CommonPayload;
  header: JwtHeader;
  signature: string;
};

export async function verifyToken(
  token: string,
  issuer: TOKEN_ISSUER
): Promise<any> {
  const decodedToken = jwt.decode(token, { complete: true });
  if (!decodedToken?.header?.kid) {
    throw new Error("kid not present in JWT header");
  }
  const verifyKey = await getSigningKey(decodedToken.header.kid, issuer);
  const validatedToken = jwt.verify(token, verifyKey, {
    complete: true,
    clockTolerance: NBF_LEEWAY_SECONDS,
  });

  if (isValidToken(validatedToken)) {
    return validatedToken;
  }
  throw new Error(
    "Token had valid signature, but missing common claims expected for B2C and AD"
  );
}
type ValidateParams = {
  token: string;
  issuer: TOKEN_ISSUER;
};

type EncodedState = {
  redirectTo: string;
  nonce?: string;
  skipNonce?: boolean;
};

type IssuerInfo = {
  clientId: string;
  tenantId: string;
  jwksUri: string;
};

const TENANT_MAPPING: Record<TOKEN_ISSUER, IssuerInfo> = {
  Auth0: {
    clientId: `${config.login_web.auth0_client_id}`,
    tenantId: `${
      config.login_web.auth0_audience || config.login_web.auth0_audience_core
    }`,
    jwksUri: `${config.login_web.auth0_base_url}/.well-known/jwks.json`,
  },
};

export async function validateToken(tokenParams: ValidateParams) {
  const { token, issuer } = tokenParams;
  logger.debug({ key: LogActions.VALIDATE_TOKEN, token });

  try {
    const verifiedToken = await verifyToken(token, issuer);
    await validateClaims(verifiedToken, issuer);
    return true;
  } catch (error) {
    logger.error({
      key: LogActions.UNABLE_TO_VALIDATE_TOKEN,
      error: error,
      message: `Invalid or non-existent token error`,
    });
    return false;
  }
}

export async function validateClaims(
  decodedToken: AzureToken,
  issuer: TOKEN_ISSUER
) {
  logger.debug({ key: "INCOMING_TOKEN_VALIDATION", decodedToken });
  const issuerInfo = TENANT_MAPPING[issuer];
  const { aud, appid, azp, tid, iss } = decodedToken?.payload;
  const checkAudience =
    aud === issuerInfo.tenantId ||
    appid === issuerInfo.clientId ||
    azp === issuerInfo.clientId;

  if (!checkAudience) {
    throw new Error(
      `Audience value in payload ${aud} does not match config value ${
        config.login_web.auth0_audience || config.login_web.auth0_audience_core
      }`
    );
  }

  const checkTenant =
    tid?.includes(issuerInfo.tenantId) ||
    iss?.includes(issuerInfo.tenantId) ||
    aud?.includes(issuerInfo.tenantId);

  if (!checkTenant) {
    throw new Error(
      `Tenant id in payload ${tid}, ${iss}, or ${aud} does not match config value ${issuerInfo.tenantId}`
    );
  }
}

export async function getSigningKey(kid: string, issuer: TOKEN_ISSUER) {
  const tenantInfo = TENANT_MAPPING[issuer];

  logger.debug({
    key: LogActions.VALIDATE_TOKEN,
    jwksUri: tenantInfo.jwksUri,
    kid: kid,
    issuer: issuer,
  });

  const client = jwksClient({
    jwksUri: tenantInfo.jwksUri,
  });

  const key = await client.getSigningKey(kid);
  const signingKey = key.getPublicKey();
  return signingKey;
}

export function isValidToken(object: any): object is AzureToken {
  if (
    object.payload?.aud &&
    object.payload?.iss &&
    object.payload?.iat &&
    object.payload?.exp
  ) {
    return true;
  }
  return false;
}

export const validateAuth0Token = async (token: any) => {
  if (!token) {
    throw new Error("No access token present on req.body or req.authResult");
  }

  await validateToken({
    token: token,
    issuer: TOKEN_ISSUER.AUTH0,
  });
};

export const getAzureSqlClient = async (): Promise<ConnectionPool> => {
  const sqlClient = await runAsyncWithRetry({
    func: async () => getSqlClient(APIDATA_SQL_DATABASE_CONFIG),
    options: {
      onError: (error) => {
        logger.warn({
          key: LogActions.DATAHUB_CONNECTION_ERROR,
          error: error,
          message: `Error getting SQL connection. Retrying`,
          location: `snapshot/exportSnapshot.ts/getApplySpreadAzureSqlClient`,
        });
      },
    },
  });
  return sqlClient;
};
