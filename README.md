Project Description
This project is a simple authentication API built using:

    - Node.js & Express.js
    - PostgreSQL (via Prisma ORM)
    - Bcrypt (for password hashing)
    - JSON Web Token (JWT) for authentication

It provides endpoints for:
    - User Signup
    - User Login

Installation & Setup

1. Clone the Repository

    git clone https://github.com/anishjoshi0949/Login-and-Sign-up.git
    cd auth-api

2. Install Dependencies
    npm install

3. Set Up PostgreSQL
    - Create a PostgreSQL database (e.g., auth_db).
    - Update the .env file with your DB credentials 

    DATABASE_URL="postgresql://<username>:<password>@localhost:5432/auth_db?schema=public"
    JWT_SECRET="your_jwt_secret_key"

4. Set Up Prisma
    npx prisma init
    npx prisma migrate dev --name init

5. Run the Project
    node src/index.js

API will run on: http://localhost:3000


Note
    - Passwords are hashed using bcrypt
    - JWT tokens are generated upon login
    - Use JWT for accessing protected routes (extend as needed)

To Do
    - Add protected routes
    - Add refresh tokens
    - Email verification
    - Frontend UI (optional)


NODE_ENV=development
DATABASE_URL=""
JWT_SECRET="yoursecretkey"
PORT=

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_FROM_NUMBER=

SENDGRID_API_KEY=''
=======
Project Description
This project is a simple authentication API built using:

    - Node.js & Express.js
    - PostgreSQL (via Prisma ORM)
    - Bcrypt (for password hashing)
    - JSON Web Token (JWT) for authentication

It provides endpoints for:
    - User Signup
    - User Login

Installation & Setup

1. Clone the Repository

    git clone https://github.com/anishjoshi0949/Login-and-Sign-up.git
    cd auth-api

2. Install Dependencies
    npm install

3. Set Up PostgreSQL
    - Create a PostgreSQL database (e.g., auth_db).
    - Update the .env file with your DB credentials 

    DATABASE_URL="postgresql://<username>:<password>@localhost:5432/auth_db?schema=public"
    JWT_SECRET="your_jwt_secret_key"

4. Set Up Prisma
    npx prisma init
    npx prisma migrate dev --name init

5. Run the Project
    node src/index.js

API will run on: http://localhost:port


Note
    - Passwords are hashed using bcrypt
    - JWT tokens are generated upon login
    - Use JWT for accessing protected routes (extend as needed)

To Do
    - Add protected routes
    - Add refresh tokens
    - Email verification
    - Frontend UI (optional)

What you need to include in your .env file:
NODE_ENV=development
DATABASE_URL=""
JWT_SECRET=""
PORT=

GOOGLE_CLIENT_ID=.com
GOOGLE_CLIENT_SECRET=

TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_FROM_NUMBER=

SENDGRID_API_KEY=''
