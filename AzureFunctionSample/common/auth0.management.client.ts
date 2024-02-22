import axios from "axios";
import { logger } from "our-common-packages/dist/logging";
import { LogActions } from "../app.constants";

import {
  AUTH0_API_REGISTRATION_AUDIENCE,
  AUTH0_API_REGISTRATION_CLIENT_ID,
  AUTH0_API_REGISTRATION_CLIENT_SECRET,
  AUTH0_BASE_URL,
} from "../app.constants";

type Auth0ManagementTokenResponse = {
  access_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
};

export const getAuth0ManagementToken =
  async (): Promise<Auth0ManagementTokenResponse> => {
    const options = {
      method: "POST",
      url: `${AUTH0_BASE_URL}/oauth/token`,
      headers: { "content-type": "application/x-www-form-urlencoded" },
      data: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: AUTH0_API_REGISTRATION_CLIENT_ID,
        client_secret: AUTH0_API_REGISTRATION_CLIENT_SECRET,
        audience: AUTH0_API_REGISTRATION_AUDIENCE,
      }),
    };

    try {
      const response = await axios.request<Auth0ManagementTokenResponse>(
        options
      );

      logger.debug({ key: LogActions.AUTH0_RESPONSE, response });

      return response.data;
    } catch (error) {
      throw error;
    }
  };
