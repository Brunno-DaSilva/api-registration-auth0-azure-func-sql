import axios, { AxiosRequestConfig } from "axios";
import { logger } from "our-common-packages/dist/logging";
import { AUTH0_BASE_URL } from "../app.constants";
import { getAuth0ManagementToken } from "../clients/auth0.management.client";
import {
  Auth0Connection,
  Auth0UserInformation,
} from "../common/types/auth0.types";
import LogActions from "../logActions";

export const getAuth0UserByEmail = async (
  email: string
): Promise<Array<Auth0UserInformation>> => {
  const token = await getAuth0ManagementToken();

  const options = {
    method: "GET",
    url: `${AUTH0_BASE_URL}/api/v2/users-by-email`,
    params: { email: email },
    headers: {
      authorization: `Bearer ${token.access_token}`,
    },
  };

  try {
    const userInformation = await axios.request<Array<Auth0UserInformation>>(
      options
    );
    return userInformation.data;
  } catch (error) {
    logger.error({
      key: LogActions.AUTH0_ERROR,
      message:
        "There was a problem with the auth0 request for user information.",
      error: error,
    });
    return [];
  }
};

export const getAuth0Connections = async (): Promise<
  Array<Auth0Connection>
> => {
  const token = await getAuth0ManagementToken();

  const options = {
    method: "GET",
    url: `${AUTH0_BASE_URL}/api/v2/connections`,
    headers: {
      "content-type": "application/json",
      Authorization: `Bearer ${token.access_token}`,
    },
  };

  const connectionsResponse = await axios.request<Array<Auth0Connection>>(
    options
  );

  return connectionsResponse.data;
};

export const postApiRegistration = async (
  registrationDetails
): Promise<Auth0Connection> => {
  const token = await getAuth0ManagementToken();
  const url = `${AUTH0_BASE_URL}/api/v2/clients`;
  const DATAHUB_API_ID = "datahub-api";

  let data = JSON.stringify({
    name: registrationDetails.AppName,
    description: `Auth0 Generic Api registration ${registrationDetails.CustomerCode}`,
    callbacks: [],
    client_aliases: [],
    allowed_clients: [`${DATAHUB_API_ID}`],
    grant_types: ["client_credentials"],
    token_endpoint_auth_method: "client_secret_post",
    app_type: "non_interactive",
    is_first_party: true,
    oidc_conformant: false,
    jwt_configuration: {
      lifetime_in_seconds: 36000,
      scopes: {},
      alg: "RS256",
      secret_encoded: false,
    },
    cross_origin_authentication: false,
    sso_disabled: false,
    custom_login_page_on: true,
    native_social_login: {
      apple: {
        enabled: false,
      },
      facebook: {
        enabled: false,
      },
    },
    refresh_token: {
      expiration_type: "non-expiring",
      leeway: 0,
      infinite_token_lifetime: true,
      infinite_idle_token_lifetime: true,
      token_lifetime: 31557600,
      idle_token_lifetime: 2592000,
      rotation_type: "non-rotating",
    },
  });

  const options: AxiosRequestConfig = {
    url: url,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token.access_token}`,
    },
    data: data,
  };

  const connectionsResponse = await axios.request<Auth0Connection>(options);

  return connectionsResponse.data;
};

export const postCreateClientGrant = async (
  client_id
): Promise<Auth0Connection> => {
  const token = await getAuth0ManagementToken();
  const url = `${AUTH0_BASE_URL}/api/v2/client-grants`;
  const API_IDENTIFIER = "datahub-api";

  let data = JSON.stringify({
    client_id: client_id,
    audience: `${API_IDENTIFIER}`,
    scope: [],
  });

  const options: AxiosRequestConfig = {
    url: url,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token.access_token}`,
    },
    data: data,
  };

  const connectionsResponse = await axios.request<Auth0Connection>(options);

  return connectionsResponse.data;
};

export const deleteApiRegistration = async (
  client_id
): Promise<Auth0Connection> => {
  const token = await getAuth0ManagementToken();
  const url = `${AUTH0_BASE_URL}/api/v2/clients/${client_id}`;

  const options = {
    url: url,
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token.access_token}`,
    },
  };

  try {
    const connectionsResponse = await axios.request<Auth0Connection>(options);

    return connectionsResponse.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error instanceof Error) {
      logger.error({
        key: "Axios Error:",
        message: `${error.message}`,
        error: error,
      });
    } else {
      logger.error({
        key: LogActions.AUTH0_ERROR,
        message: "There was a problem with the auth0 Delete Client.",
        error: error,
      });
    }
    throw error;
  }
};

export const updateApiRegistration = async (
  client_id,
  registrationDetails
): Promise<Auth0Connection> => {
  const token = await getAuth0ManagementToken();
  const url = `${AUTH0_BASE_URL}/api/v2/clients/${client_id}`;

  let data = JSON.stringify({
    name: registrationDetails.AppName,
  });

  const options: AxiosRequestConfig = {
    url: url,
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token.access_token}`,
    },
    data: data,
  };

  try {
    const connectionsResponse = await axios.request<Auth0Connection>(options);

    return connectionsResponse.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error instanceof Error) {
      logger.error({
        key: "Axios Error:",
        message: `${error.message}`,
        error: error,
      });
    } else {
      logger.error({
        key: LogActions.AUTH0_ERROR,
        message: "There was a problem with the auth0 Update Client.",
        error: error,
      });
    }
    throw error;
  }
};
