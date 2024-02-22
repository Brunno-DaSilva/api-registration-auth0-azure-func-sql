import {
    deleteApiRegistration,
    postApiRegistration,
    postCreateClientGrant,
    updateApiRegistration
} from '../../accessor/auth0.accessor';
import { logger } from 'lamp5-common-packages/dist/logging';
import LogActions from '../../logActions';

import { GenericApiRegistrationSecret, MutationAddRegistrationArgs } from './typeDefs';
import { sqlLogger } from '../../common/sqlLogger/logger';

export const resolvers = {
    Query: {
        RegistrationDetails: async (_, { appRegistrationCode }, { dataSources }) => {
            return await dataSources.dataHubConnection.GetRegistrationDetails(appRegistrationCode);
        },

        Registrations: async (_, { customerCode, sort }, { dataSources }) => {
            return await dataSources.dataHubConnection.GetRegistrations(customerCode, sort);
        },

        GenericApiVendorsByCustomerCode: async (_, { customerCode, search }, { dataSources }) => {
            return await dataSources.dataHubConnection.GetVendorsByCustomerCode(
                customerCode,
                search
            );
        },

        LampConnectFieldsByCustomerCode: async (_, { customerCode, search }, { dataSources }) => {
            return await dataSources.dataHubConnection.GetLampConnectFieldsByCustomerCode(
                customerCode,
                search
            );
        }
    },
    Mutation: {
        AddRegistration: async (
            _,
            { apiRegistrationConfig }: MutationAddRegistrationArgs,
            { dataSources, userSessionData }
        ): Promise<GenericApiRegistrationSecret> => {
            try {
                const auth0ApiResult = await postApiRegistration(apiRegistrationConfig);

                if (!auth0ApiResult) {
                    logger.error({
                        key: LogActions.AUTH0_ERROR,
                        message: 'Auth0 API response is empty.',
                        error: 'No Data Empty Response'
                    });
                }

                const { client_id, client_secret } = auth0ApiResult;

                sqlLogger.info(
                    'LAMP DataHub Connector',
                    'resolvers.ts/AddRegistration',
                    `ClientID ${client_id} added on auth0`,
                    { user: userSessionData.CurrentUserCode }
                );

                apiRegistrationConfig.ClientId = client_id;

                await postCreateClientGrant(client_id);

                const SQLresult = await dataSources.dataHubConnection.AddGenericApiAppRegistration(
                    apiRegistrationConfig,
                    userSessionData.CurrentUserCode
                );

                if (SQLresult) {
                    const result: GenericApiRegistrationSecret = {
                        ClientSecret: client_secret,
                        RegistrationDetails: SQLresult
                    };
                    return result;
                } else {
                    throw new Error('Failed to save registration to SQL.');
                }
            } catch (error) {
                logger.error({
                    key: LogActions.AUTH0_ERROR,
                    message: 'Auth0 API response is empty.',
                    error: error
                });

                if (error instanceof Error) {
                    sqlLogger.error(
                        'LAMP DataHub Connector',
                        'resolvers.ts/AddRegistration',
                        error.message,
                        { user: userSessionData.CurrentUserCode, error }
                    );
                }
                throw error;
            }
        },

        RemoveRegistration: async (
            _,
            { appRegistrationCode, customerCode },
            { dataSources, userSessionData }
        ) => {
            const registrationDetails = await dataSources.dataHubConnection.GetRegistrationDetails(
                appRegistrationCode
            );

            await deleteApiRegistration(registrationDetails.ClientId);
            sqlLogger.info(
                'LAMP DataHub Connector',
                'resolvers.ts/RemoveRegistration',
                `ClientID ${registrationDetails.ClientId} deleted from auth0`,
                {
                    user: userSessionData.CurrentUserCode,
                    customerCode: customerCode
                }
            );

            return await dataSources.dataHubConnection.RemoveGenericApiAppRegistration(
                appRegistrationCode,
                customerCode,
                userSessionData.CurrentUserCode
            );
        },
        UpdateRegistration: async (
            _,
            { appRegistrationCode, customerCode, updatedRegistrationData },
            { dataSources, userSessionData }
        ) => {
            const registrationDetails = await dataSources.dataHubConnection.GetRegistrationDetails(
                appRegistrationCode
            );

            const newAppName = await updateApiRegistration(
                registrationDetails.ClientId,
                updatedRegistrationData
            );
            sqlLogger.info(
                'LAMP DataHub Connector',
                'resolvers.ts/UpdateRegistration',
                `ClientID ${registrationDetails.ClientId} updated on auth0`,
                {
                    user: userSessionData.CurrentUserCode,
                    customerCode: customerCode,
                    currentData: registrationDetails,
                    newData: updatedRegistrationData
                }
            );

            const updatedData = {
                ...registrationDetails,
                ...updatedRegistrationData
            };

            return await dataSources.dataHubConnection.UpdateGenericApiAppRegistration(
                appRegistrationCode,
                customerCode,
                updatedData,
                userSessionData.CurrentUserCode
            );
        }
    }
};
