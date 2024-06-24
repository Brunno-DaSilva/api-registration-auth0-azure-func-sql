<h1>Api Registration with Auth0,Azure functions and SQL</h1>

Here is an overview of a recent project I led, that involved the re-design and implementation of the API registration process, where customers would be allowed to retrieve specific sets of data from an API.

The API endpoint was provided by Azure functions, whose main purposes were to authenticate the user and call SQL store procedures.

Upon execution, the store procedure would then provide data for the user.

## App Registration Tool 🚀

App Registration is an automation service that enables authorized users to seamlessly manage API registrations. With App Registration, you can effortlessly create, edit, and remove API registrations, each containing essential authentication details and tailored configurations for your API calls.

Users who belong to the customer administrator group and possess the 'AddEditAppRegistration' privileges can access an API App Registration page within LAMP.

## Service flow Diagram 🌊

![Registration Work Flow](image-1.png)

In this service flow diagram, the journey begins with a user being authenticated. If the user possesses the correct permissions, the App registration will be displayed. These permissions include being part of the administrator group and having either the `AddEditAppRegistration` or `ViewAppRegistration` privileges.

Once the user has the necessary permissions, they can access the App registration and proceed to fill out the required API form to request a new API. The system initiates this process by sending a POST request to Auth0, where the user's identity is authenticated, and new API credentials are generated. These credentials consist of a Client ID and Client Secret.

Upon successful generation of the API credentials, the user is prompted to copy both the Client ID and Client Secret. These credentials are essential as they empower the user to generate a Bearer token, which, in turn, enables them to access and utilize the API securely.

## Azure Functions API ⚡

Azure Functions APIs offer a robust and versatile set of services to meet various client needs. Among these, are:

- Vendors API [GET]
- Fields API [GET]
- Asset Request API [GET]
- Data Feed API [POST]

The Vendors API facilitates access to vendor information, while the Fields API offers a comprehensive list of fields, they are both static data sets. The Asset Request API streamlines asset management by providing a list of assets, that can vary from customer to customer, and the Data Feed API empowers users to seamlessly create their own API end point by posting data to specific database. These Azure Functions APIs collectively provide a powerful toolkit for developers and clients to interact with and leverage data and services in a dynamic and efficient manner.

Below is a diagram that aids in illustrating the flow of the service.

![Azure Function workflow](image-2.png)

## Get the Authentication token 🛡️

The authentication token comes from Auth0. I am leveraging the current login process that authenticates the user.

The API configuration in Auth0 is simple. I have created a Machine-to-Machine application that generates other applications' APIs, with specific rights. Auth0 then will assign a client ID and client secret that is later passed into the bearer token. Each application operates independently, and customers can have as many applications with different API configurations as they wish.

In Auth0 I can configure the token specifications, like size and expiration, and increase the level of security and permission given to a single application API.

### How to request a bearer token from Auth0 🪙

We use the curl request below in Postman to request a bearer token.

```
curl --location 'https://{AUTH0_COMPANY_DOMAIN}.us.auth0.com/oauth/token' \
--header 'content-type: application/json' \
--header 'Cookie: did=s%3Av0%3A607aed70-411d-11ee-9f58-cf9e3b1d7f78.tzGO4NUZU%2BL1TExAHW1fu8WHjyArIRmhFdmi%2FGZ4OLM; did_compat=s%3Av0%3A607aed70-411d-11ee-9f58-cf9e3b1d7f78.tzGO4NUZU%2BL1TExAHW1fu8WHjyArIRmhFdmi%2FGZ4OLM' \
--data '{"client_id":"ADD_CLIENT_ID","client_secret":"ADD_CLIENT_SECRET","audience":"ADD_AUDIENCE","grant_type":"client_credentials"}'
```

<br/>

- Notice that this cURL command is composed of the `client_id`, `client_secret`, and `audience`; they are derived from an active application inside of `Auth0>Applications`.
  - `client_id`: Refers to the Machine To Machine Client ID
  - `client_secret`: Refers to the Machine To Machine Client Secret
  - `audience`: Refers to the API Identifier for the authorized API.
    - This value can be found under `Applications/YourTargetApplication/APIs`

<div style="border-left: 2px solid #5bc0de; background:#e3edf2; padding: 0.8rem;" >
<span >
💡 <b>Attention</b>: Please, ensure that those values are replaced to target your API information. 
</span>

<br />
</div>

<br />

- Finally, a new tab will appear containing your POST request information, submit the request to get your token.

**Token Example:**

```
{
    "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InVEUVIwZEF3bVNwNWU1NmZ2NTg1cCJ9.eyJpc3MiOiJodHRwczovL3RyYWNlMy51cy5hdXRoMC5jb20vIiwic3ViIjoiSHIxVHNvOVRpWk5LY0RSVlp0YnoxUHlzOExjUzlHblFAY2xpZW50cyIsImF1ZCI6ImNvcmUtYXBpIiwiaWF0IjoxNjkyNzM3MjgyLCJleHAiOjE2OTI4MjM2ODIsImF6cCI6IkhyMVRzbzlUaVpOS2NEUlZadGJ6MVB5czhMY1M5R25RIiwiZ3R5IjoiY2xpZW50LWNyZWRlbnRpYWxzIn0.T641D8Iz0ZST8e9-cHygYq7qj5QvcL3pCCustqNB8wdepDESB5eddoQG_QPyFMhmalbWbVSU8vIV293XT9j5AqcZZgiRJE3-K5TVzmdJ6LNROlIsNkQQXOlSbh3fiF6ENEScslo-6w6K3NQKPc3B1p2xTHaVUUrLgd_WkkMdWM_LRJvHBRKWrmbGhX-EhSC1pywOqmrL368sgD3f05EBa3MYYz-Xeo53mOtZUK2K8niZNYqNq1gTDF7sfMcVoubGfRr3Ug7cizbIyEMPi5vM_sFXpT2Cc1l-heZghDRSHX7_X6n33DRfOUp-just-A-Sample",
    "expires_in": 86400,
    "token_type": "Bearer"
}
```

## How to get data from the Azure Functions ⛈️

Once again, we use postman to hit the API, passing the authorization token to retrive the data.

Here is how to use Postman to get data from the Vendors API:

- Open Postman and make sure you are logged in to your Postman account.

- Create a new GET request by clicking on the "New" button in the top left corner of the Postman application.

- In the request configuration panel, select the GET method from the dropdown menu.

- Paste the Azure Function URL for the Vendors API into the request URL field. For UAT, the URL should be:

  - `https://function-app-name-ENV.azurewebsites.net/api/get-api-data-function?code=sdsdsdsdsdsd==`

- In the "Authorization" tab, select "Bearer Token" from the Type dropdown menu.

- Add your authentication token in the "Token" field. This token is typically provided by the API or your authentication provider.

- Click the "Send" button to execute the GET request

After following these steps, Postman will send the GET request to the Vendors API with the specified Bearer Token, and you will receive the response data from the API in the Postman interface.

<br />

<a style="background: #24b1e6; color: #fff; padding: 0.6rem; text-decoration:none;" href="#">Back to top ↑ </a>

<br/>
<br/>
<br />
