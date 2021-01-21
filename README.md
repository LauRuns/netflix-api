# Nodejs API

This API is to be used with the [`NETFLIX-APP`](https://github.com/LauRuns/netflix-react-app) (Web App) and/or the [`RN-NETFLIX`](https://github.com/LauRuns/rn-netflix) project (React Native) which you will find as public projects on this Github. Together with this API they are part of a school/study project and should be used together.
Both the React and React Native project use this API for handling userdata and authentication.

# This is a study project

This is just a project for my study. Therefore teachers/instructors will receive a seperate file containing all API-keys and will not need to go through the section: Set-up guide.

# Contents

- [Prerequisites](##prerequisites)
  - [How to check if Node is installed?](##how-to-check-if-Node-is-installed?)
- [Set-up guide](#set-up-guide)
- [Technologies used](#technologies-used)
- [Installation](#installation)
- [Environment variables](#environment-variables)
- [Demo](#demo)
- [Available REST endpoints](#available-rest-endpoints)
  - [User](##user-endpoints)
  - [Auth](##auth-endpoints)
  - [Favorites](##favorites-endpoints)
- [License](#license)

# Prerequisites

It is required that you have Nodejs installed on your machine before installing this project.

## How to check if Node is installed?

Open a terminal and run:

```
node -v
```

This should return a version number, something like: `v12.18.3`

If you do not yet have Node installed you can do so by going to: [https://nodejs.org/en/](https://nodejs.org/en/)
or if you are on a Mac and use Homebrew run:

```
brew install node
```

After installation run the `node -v` command again and verify that Node is installed correct.

# Set-up guide

This API uses MongoDB for persisting data. Throughout the API the `Mongoose` module is used (its a dependency) for interacting with the database.
You will need to create a MongoDB atlas account which can be done at [https://www.mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas).

A SaaS platform is used for sending emails to users. Should the user wish to this as well, then creating an account with services like [Sendgrid](https://sendgrid.com/solutions/email-api/) or [Sendinblue](https://www.sendinblue.com/) is required. If no API key from a service as mentiond is provided, then sending transactional emails to the user will not be possible. This means that sending emails for resetting the users password will also not be passible.

# Technologies used

- Both React applications mentioned in the intro use the API for authenticating users. Modules [bcrypt](https://www.npmjs.com/package/bcrypt) and [jwt](https://www.npmjs.com/package/jsonwebtoken) are used in the authentication flow.
- The [Mongoose](https://mongoosejs.com/) module is used to interact with the MongoDB Client Atlas and persist the user data.
- To inform users when they Sign Up or they have forgotten their password, a SMTP service is used to send [Transactional emails](https://www.sendinblue.com/features/transactional-email/) to the user. This API uses [Sendinblue](https://www.sendinblue.com/) which is a SaaS platform, to handle these emails. (Sendinblue is on of [many](https://www.g2.com/products/twilio-sendgrid-email-api/competitors/alternatives) solutions for sending transactional emails)
- The emailing SaaS solution provided by Sendinblue is used by [Nodemailer](https://nodemailer.com/about/), a Nodejs module for sending emails.
- Users can upload their image which is handled by the [Multer](https://www.npmjs.com/package/multer) middleware.
- [Nodemon](https://www.npmjs.com/package/nodemon) is used to run the API in a development environment.

# Installation

Clone the project to your designated folder and run

```
npm install
```

All the project dependencies will be installed and a `node_modules` folder is created.

# Environment variables

Create a `.env` file in the root folder and enter all environment variables as listed in the `.env-example` which you find in the root folder as well.
Should you not wish to use a mailing solution to inform users, then the following options can be removed from the `.env` file:

- `REMOTE_CONNECTION_STRING`
- `SMTP_KEY`
- `SENDER`

You will need to select a port on which the API can be reached by the frontend applications

<img src="https://github.com/LauRuns/readme-gifs/blob/main/api/env_variables_netflix_api.gif?raw=true" alt='Set variables' />
<br />
<br />

# Demo

After setting the environment variables, start the API by running the command:

```
npm run start
```

The API should now be up and running. A confirmation should be presented in the console:
<img src="https://github.com/LauRuns/readme-gifs/blob/main/api/api_ruin_start.gif?raw=true" alt='Run start' />

Start one of the frontend applications mentioned below the title section of this Readme and login or sign up

Open the access.log file that is automatily created in the `/src` folder next to the `app.js` file.
A login or sign up attempt should now be logged:

```
::1 - - [12/Jan/2021:08:17:23 +0000] "OPTIONS /api/users/login HTTP/1.1" 200 19 "http://localhost:3000/"
::1 - - [12/Jan/2021:08:17:24 +0000] "POST /api/users/login HTTP/1.1" 200 2550 "http://localhost:3000/"
```

! The `localhost:3000` is the port on which the frontend is running. It calls the API on `locahost:8082`

# Available REST endpoints

- If you choose to run this API using your own domain name, then the endpoints will start with `https://mydomainname.com/api`
- If you are running this API local, the endpoints will be available on `http://localhost:8082/api` or `http://127.0.0.1:8082/api`. Set the `PORT` nr of your choice, `8082` is just used as an example here.

## User endpoints:

1. `api/users/signup` POST-request
   - This endpoint accepts JSON data with format:
   ```
   {
       "name": "John Doe",
       "email": "johndoe@mail.com",
       "password": "johndoe1234",
       ""country: {
           "country": "USA",
           "countryId": "46",
           "countryCode": "US"
       }
   }
   ```
2. `api/users/login` POST-request
   - This endpoint accepts JSON data with format:
   ```
   {
       "email": "johndoe@mail.com",
       "password": "johndoe1234"
   }
   ```
3. `api/users/<enter_user_id_here>` GET-request

   - Only authorised users are allowed to perform this action. A valid JWT must be assigned to the request.

4. `api/users/<enter_user_id_here>` PATCH-request
   - This endpoint accepts form-data and images for updating the user.

<hr />

## Auth endpoints:

1. `api/auth/reset` POST-request
   - For recovering the users password.
   - This endpoint accepts JSON data with format:
   ```
   {
       "email": "janedoe@mail.com"
   }
   ```
2. `api/auth/reset/pwd/<insert_reset_token_here>` POST-request
   - Allows for resetting the users password after having received a resetlink by email.
   - This endpoint accepts JSON data with format:
   ```
   {
       "newPassword":"janedoe9876",
       "confirmNewPassword":"janedoe9876",
   }
   ```
3. `api/auth/update/<enter_user_id_here>` PATCH-request

   - Allows the logged in user to update the password in the account section.
   - This endpoint accepts JSON data with format:

   ```
   {
       "email": "jandoe@mail.com",
       "oldPassword": "janedoe9876",
       "newPassword": "jandoenew929292"
       "confirmNewPassword": "jandoenew929292"
   }
   ```

<hr />

## Favorites endpoints:

All Favorites endpoint require a authentication token on the request.

1. `api/favorites/<enter_user_id_here>` GET-request

   - Returns alle saved favorite-ID items for the matching user-ID

2. `api/favorites` POST-requst

   - Allows for saving new favorite items.
   - This endpoint accepts JSON data with format:

   ```
   {
       "nfid": "283480902", // the netflix id for this item
       "title": "Lorem Ipsum!",
       "year": "2016",
       "synopsis": "information about the item - story line",
       "img": "https://link_to_the_image",
       "imdrating": "7,6"
   }
   ```

3. `api/favorites/<favorite_item_id_here>` DELETE-request
   - Deletes the favorite item provided as param.

<hr />

## License

This project has no license.
