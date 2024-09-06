# SIR0

## Project Description
A games distribution platform with community functionalities like communication through chats and games selling with proccessing of the payment.

## Application Suitability

### ✔ Relevance
- Growing Market Demand
- Seamless Payment and Acquisition
- Scalability and Flexibility

### ✔ Why microservices are necessary
- Continuous Deployment and Updates
- Customization and Extensibility
- Complexity Management

### ✔ Real World Examples

#### Steam

- Storefront and Catalog Management: Steam’s store microservice handles the vast catalog of games, DLCs, and other digital content. This microservice ensures users can browse, filter, and search through thousands of games. It is responsible for game listings, price localization, discounts, and recommendations based on user behavior.
- Purchasing and Ownership: Once a user purchases a game, this microservice communicates with Steam’s user accounts service to update the user’s library, allowing them to download and install their purchase. It also handles currency conversions, regional pricing, and tax calculations.

- Authentication Microservice:
Steam Guard: Steam uses a dedicated microservice for authentication, including features like Steam Guard (two-factor authentication). This microservice is responsible for user login, session management, and account recovery processes.
- OAuth and API Access: Steam’s authentication microservice supports OAuth for external integrations, allowing users to sign in to third-party services and websites using their Steam credentials without compromising their security.

#### Epic Games Store
- Digital Distribution and Purchasing: The Epic Games Store provides a games store microservice that handles game listings, sales, and distribution. It focuses on high scalability to support major sales events, such as free game promotions, which bring massive spikes in traffic.
- Developer Revenue Sharing: Epic’s store microservice tracks developer revenue shares and handles the complexities of different pricing models, refunds, and discounts. This microservice also tracks when users redeem free games or claim offers.

- Epic Account Services: Epic has a dedicated authentication microservice known as Epic Account Services. It allows players to log in to both the Epic Games Store and any games using Epic’s login infrastructure (e.g., Fortnite, Rocket League).
- Social Logins and Token-Based Auth: Epic’s authentication service supports logins via Google, Facebook, and other social accounts, using token-based authentication to manage sessions securely across various devices and games.

----

## Service Boundaries
System architecture diagram goes here ->

----

## Technology Stack and Communication Patterns

### ✔ Programming Languages
- Python
- JavaScript

### ✔ Frameworks
- Flask

### ✔ Environments
- NodeJS

----

## Data Management
enumerate all the endpoints across all your services and define the data to be transferred, including its format and type (you may present it in JSON format, Protobuf format, or any preferred format, with clarity being utmost importance). Furthermore, you will define the response returned by each endpoint here ->

----

## Deployment and Scaling
describe docker use here ->