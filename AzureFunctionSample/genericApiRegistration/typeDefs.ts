import { gql } from 'apollo-server-express';

export const genericApiTypeDefs = gql`
    type GenericApiRegistration {
        AppRegistrationCode: String!
        CustomerCode: String!
        ClientId: String
        AppType: String
        AppName: String
        ResponseType: String
        RequestVendors: String
        RequestStatuses: String
        RequestFieldNames: String
        FeedAddAssets: Boolean
        FeedUpdateCustomFields: Boolean
        FeedDefaultPhysicalLocationCode: String
        FeedErrorHandlingPreference: String
        FeedErrorEmailList: String
        Created: String
        CreatedBy: String
        Updated: String
        UpdatedBy: String
        Deleted: String
        DeletedBy: String
    }
    input GenericApiRegistrationInput {
        AppRegistrationCode: String
        CustomerCode: String!
        AppType: String!
        AppName: String!
        ResponseType: String
        RequestVendors: String
        RequestStatuses: String
        RequestFieldNames: String
        FeedAddAssets: Boolean
        FeedUpdateCustomFields: Boolean
        FeedDefaultPhysicalLocationCode: String
        FeedErrorHandlingPreference: String
        FeedErrorEmailList: String
        Created: String
        CreatedBy: String
        Updated: String
        UpdatedBy: String
        Deleted: String
        DeletedBy: String
    }

    type GenericApiRegistrationSecret {
        RegistrationDetails: GenericApiRegistration!
        ClientSecret: String
    }

    type GenericApiVendorsByCustomerCode {
        VendorName: String
        VendorCode: String
    }

    type LampConnectFieldsByCustomerCode {
        FieldSource: String
        FieldName: String
        FieldLabel: String
        Sort: String
    }

    type VendorResult {
        total: Int
        source: [GenericApiVendorsByCustomerCode]
    }
    type ConnectFieldsResult {
        total: Int
        source: [LampConnectFieldsByCustomerCode]
    }

    type Query {
        RegistrationDetails(
            appRegistrationCode: String!
            customerCode: String!
        ): GenericApiRegistration

        Registrations(customerCode: String!, sort: Sort): [GenericApiRegistration]

        GenericApiVendorsByCustomerCode(customerCode: String!, search: Search): VendorResult

        LampConnectFieldsByCustomerCode(customerCode: String!, search: Search): ConnectFieldsResult
    }

    type Mutation {
        AddRegistration(
            apiRegistrationConfig: GenericApiRegistrationInput!
        ): GenericApiRegistrationSecret

        RemoveRegistration(
            appRegistrationCode: String!
            customerCode: String!
        ): GenericApiRegistrationSecret

        UpdateRegistration(
            appRegistrationCode: String!
            customerCode: String!
            updatedRegistrationData: GenericApiRegistrationInput!
        ): GenericApiRegistrationSecret
    }
`;

export type Maybe<T> = T | null;

export type GenericApiRegistration = {
    __typename?: 'GenericApiRegistration';
    AppRegistrationCode: string;
    CustomerCode: string;
    ClientId?: Maybe<string>;
    AppType?: Maybe<string>;
    AppName?: Maybe<string>;
    ResponseType?: Maybe<string>;
    RequestVendors?: Maybe<string>;
    RequestStatuses?: Maybe<string>;
    RequestFieldNames?: Maybe<string>;
    FeedAddAssets?: Maybe<boolean>;
    FeedUpdateCustomFields?: Maybe<boolean>;
    FeedDefaultPhysicalLocationCode?: Maybe<string>;
    FeedErrorHandlingPreference?: Maybe<string>;
    FeedErrorEmailList?: Maybe<string>;
    Created?: Maybe<string>;
    CreatedBy?: Maybe<string>;
    Updated?: Maybe<string>;
    UpdatedBy?: Maybe<string>;
    Deleted?: Maybe<string>;
    DeletedBy?: Maybe<string>;
};

export type Query = {
    __typename?: 'Query';
    RegistrationDetails?: Maybe<GenericApiRegistration>;
    Registrations?: Maybe<Array<Maybe<GenericApiRegistration>>>;
    GenericApiVendorsByCustomerCode?: Maybe<Array<Maybe<GenericApiVendorsByCustomerCode>>>;
    LampConnectFieldsByCustomerCode?: Maybe<Array<Maybe<LampConnectFieldsByCustomerCode>>>;
};

export type QueryRegistrationDetailsArgs = {
    AppRegistrationCode: string;
    CustomerCode: string;
};

export type QueryRegistrationsArgs = {
    CustomerCode: string;
    limit?: Maybe<number>;
    filter?: Maybe<string>;
    search?: Maybe<Search>;
};

export type MutationAddRegistrationArgs = {
    apiRegistrationConfig: GenericApiRegistration;
};

export type Sort = {
    field?: Maybe<string>;
    direction?: Maybe<string>;
};

export type Search = {
    keyword?: Maybe<string>;
};

export type GenericApiRegistrationSecret = {
    __typename?: 'GenericApiRegistrationSecret';
    RegistrationDetails?: GenericApiRegistration;
    ClientSecret?: Maybe<string>;
};

export type GenericApiVendorsByCustomerCode = {
    __typename?: 'GenericApiVendorsByCustomerCode';
    VendorName?: Maybe<string>;
    VendorCode?: Maybe<string>;
};

export type LampConnectFieldsByCustomerCode = {
    __typename?: 'LampConnectFieldsByCustomerCode';
    FieldSource?: Maybe<string>;
    FieldName?: Maybe<string>;
    FieldLabel?: Maybe<string>;
    Sort?: Maybe<string>;
};
