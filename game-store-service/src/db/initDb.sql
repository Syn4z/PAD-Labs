CREATE TABLE "game" (
    id SERIAL PRIMARY KEY,
    title VARCHAR(50) UNIQUE NOT NULL,
    genre VARCHAR(100) NOT NULL,
    price FLOAT NOT NULL,
    description VARCHAR(500) UNIQUE NOT NULL,
    release_date DATE NOT NULL
);
