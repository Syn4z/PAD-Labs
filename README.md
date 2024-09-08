# SIR0

## Project Description
A games distribution platform with games store and authentication features.

## Application Suitability
### ✔ Relevance
- Growing Digital Gaming Market Demand
- Convenience and Accessibility
- Seamless Payment and Acquisition
- Seamless, Fast, and Reliable Experiences
- Revenue Opportunities

### ✔ Why microservices are necessary
- Continuous Deployment and Updates
- Customization and Extensibility
- Complexity Management

### ✔ Real-World Examples
#### 🕹️ Steam
- Catalog Management: Steam’s store microservice handles the vast catalog of games, DLCs, and other digital content. 
- Purchasing and Ownership: Once a user purchases a game, this microservice communicates with Steam’s user accounts service to update the user’s library, allowing them to download and install their purchase.
- Steam Guard: Steam uses a dedicated microservice for authentication, including features like Steam Guard (two-factor authentication).

#### 🎮 Epic Games Store
- Digital Distribution and Purchasing: The Epic Games Store provides a games store microservice that handles game listings, sales, and distribution. This microservice also tracks when users redeem free games or claim offers.
- Epic Account Services: Epic has a dedicated authentication microservice known as Epic Account Services. It allows players to log in to both the Epic Games Store and any games using Epic’s login infrastructure (e.g., Fortnite, Rocket League).

----

## Service Boundaries
### ✔ System Architecture Diagram
![System Architecture Diagram](utils/SystemArchitecture.png)

----

## Technology Stack and Communication Patterns
### ✔ Programming Languages
- Python
- JavaScript

### ✔ Database
- PostgreSQL

### ✔ Frameworks
- Flask
- NestJS

### ✔ Environments
- NodeJS

### ✔ Deployment
- Docker
- Docker compose

### ✔ Communication
- HTTP/REST
- gRPC
- Postman
- Swagger

### ✔ Caching
- Redis

----

## Data Management
Each microservice will have it's separate database in PostgreSQL.
TO DO add more details about API's and functionality with databases.

### GET /api/status
#### Response
##### 200 OK
```json
    {
        "service": "string",
        "status": "OK",
        "timestamp": "timestamp"
    }
```

##### 500 Internal Server Error
```json
    {
        "service": "string",
        "status": "ERROR",
        "timestamp": "timestamp",
        "details": "string"
    }
```    

### /api/auth
- ### POST /api/auth/register
    - #### Request Body
    ```json
            {
                "username": "string",
                "email": "string",
                "password": "string"
            }
    ```        

    - #### Response
        - ##### 200 OK
            ```json
                {
                    "message": "User registered successfully",
                    "userId": "int"
                }
            ```    

        - ##### 400 Bad Request
            ```json
                {
                    "error": "string",
                    "details": "string"
                }
            ```    

- ### POST /api/auth/login
    - #### Request Body
        ```json
            {
                "email": "string",
                "password": "string"
            }
        ```    

    - #### Response 
        - ##### 200 OK
            ```json
                {
                    "message": "Login successful",
                    "token": "string"
                }
            ```    

        - ##### 401 Unauthorized
            ```json
                {
                    "error": "Invalid credentials"
                }
            ```    

- ### POST /api/auth/logout
    - #### Request Body
        ```json
            {
                "token": "string"
            }
        ```    

    - #### Response
        - ##### 200 OK
            ```json
                {
                    "message": "Logout successful"
                }
            ```    

        - ##### 400 Bad Request
            ```json
                {
                    "error": "string",
                    "details": "string"
                }   
            ```    

### api/games
- ### GET /api/games
    - #### Response
        - ##### 200 OK
            ```json
                {
                    "games": [
                        {
                        "id": "int",
                        "title": "string",
                        "genre": "string",
                        "price": "float"
                        }
                    ]
                }  
            ```       

- ### GET /api/games/{id}
    - #### Response
        - ##### 200 OK
            ```json
                {
                    "id": "id",
                    "title": "string",
                    "genre": "string",
                    "price": "float",
                    "description": "string"
                }
            ```    

        - ##### 404 Not Found
            ```json
                {
                    "error": "Game not found"
                }
            ```                

- ### POST /api/games
    - #### Request Body
        ```json
            {
                "title": "string",
                "genre": "string",
                "price": "float",
                "description": "string"
            }
        ```    

    - #### Response
        - ##### 201 Created
            ```json
                {
                    "message": "Game added successfully",
                    "gameId": "int"
                }
            ```    

        - ##### 400 Bad Request
            ```json
                {
                    "error": "string",
                    "details": "string"
                }    
            ```    

- ### PUT /api/games/{id}
    - #### Request Body
        ```json
            {
                "title": "string",
                "genre": "string",
                "price": "float",
                "description": "string"
            }
        ```    

    - #### Response
        - ##### 200 OK
            ```json
                {
                    "message": "Game updated successfully"
                }
            ```    

        - ##### 404 Not Found
            ```json
                {
                    "error": "Game not found"
                }  
            ```    

- ### DELETE /api/games/{id}
    - #### Response
        - ##### 200 OK
            ```json
                {
                    "message": "Game deleted successfully"
                }
            ```    

        - ##### 404 Not Found
            ```json
                {
                    "error": "Game not found"
                }    
            ```    

----

## Deployment and Scaling
1. Create Dockerfile for Each Service (each microservice will have its own Dockerfile to define how it is built and run)
2. Create a docker-compose.yml File (this file defines how the services are connected and configured)
3. Configure Networking (using Docker compose to set up a default network for the services, allowing them to communicate using service names)
4. Deploy the Microservices (building, starting and checking the logs)
5. Scale the Microservices (modifying the docker-compose.yml to specify the number of replicas for each service)
6. Update the Deploy (using Docker compose to scale the services to the specified number of replicas)

The scaling method I will be using is horizontal scaling to make use of more service instances. Horizontal scaling involves adding more instances of a service to handle increased load. This is beneficial because it allows the system to handle more requests by distributing the load across multiple instances. Each instance runs independently, and a load balancer will distribute incoming requests to the available instances, ensuring efficient use of resources and improved performance.

## References
- [System Architecture](https://medium.com/@beuttam/building-scalable-microservices-with-proxy-load-balancer-api-gateway-private-network-services-f25c73cc8e02)
- [Service Discovery](https://www.consul.io/)
- [Horizontal Scaling](https://www.cloudzero.com/blog/horizontal-vs-vertical-scaling/)
- [Gateway](https://docs.nestjs.com/websockets/gateways)
- [Microservices using Docker](https://middleware.io/blog/microservices-architecture-docker/)
- [Unit Testing](https://codethechange.stanford.edu/guides/guide_flask_unit_testing.html)