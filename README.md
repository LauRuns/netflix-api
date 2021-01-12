# Nodejs API

This API is to be used with the `NETFLIX-APP` and/or the `RN-NETFLIX` project which you will find as public projects on this Github. Together with this API they are part of a school/study project and should be used together.
Both the React and React Native project use this API for handling userdata and authentication.

## This is a study project

This is just a project for my study. Therefore teachers/instructors will receive a seperate file containing all API-keys and will not need to go through the section: Set-up guide.

## Prerequisites

It is required that you have Nodejs installed on your machine before installing this project.

### How to check if Node is installed?

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

## Set-up guide

This API uses MongoDB for persisting data. Throughout the API the `Mongoose` module is used (its a dependency) for interacting with the database.
You will need to create a MongoDB atlas account which can be done at [https://www.mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas).

A SaaS platform is used for sending emails to users. Should the user wish to this as well, then creating an account with services like [Sendgrid](https://sendgrid.com/solutions/email-api/) or [Sendinblue](https://www.sendinblue.com/) is required. If no API key from a service as mentiond is provided, then sending transactional emails to the user will not be possible. This means that sending emails for resetting the users password will also not be passible.

## Technologies used

- Both React applications mentioned in the intro use the API for authenticating users. Modules [bcrypt](https://www.npmjs.com/package/bcrypt) and [jwt](https://www.npmjs.com/package/jsonwebtoken) are used in the authentication flow.
- The [Mongoose](https://mongoosejs.com/) module is used to interact with the MongoDB Client Atlas and persist the user data.
- To inform users when they Sign Up or they have forgotten their password, a SMTP service is used to send [Transactional emails](https://www.sendinblue.com/features/transactional-email/) to the user. This API uses [Sendinblue](https://www.sendinblue.com/) which is a SaaS platform, to handle these emails. (Sendinblue is on of [many](https://www.g2.com/products/twilio-sendgrid-email-api/competitors/alternatives) solutions for sending transactional emails)
- The emailing SaaS solution provided by Sendinblue is used by [Nodemailer](https://nodemailer.com/about/), a Nodejs module for sending emails.
- Users can upload their image which is handled by the [Multer](https://www.npmjs.com/package/multer) middleware.
- [Nodemon](https://www.npmjs.com/package/nodemon) is used to run the API in a development environment.

## Installation

Clone the project to your designated folder and run

```
npm install
```

All the project dependencies will be installed and a `node_modules` folder is created.

### Environment variables

Create a `.env` file in the root folder and enter all environment variables as listed in the `.env-example` which you find in the root folder as well.
Should you not wish to use a mailing solution to inform users, then the following options can be removed from the `.env` file:

- `REMOTE_CONNECTION_STRING`
- `SMTP_KEY`
- `SENDER`

You will need to select a port on which the API can be reached by the frontend applications

<img src="./src/assets/env_variables_netflix_api.gif" alt='Set variables' />

## Demo

After setting the environment variables, start the API by running the command:

```
npm run start
```

The API should now be up and running. A confirmation should be presented in the console:
<img src="./src/assets/api_ruin_start.gif" alt='Run start' />

Start one of the frontend applications mentioned below the title section of this Readme and login or sign up

Open the access.log file that is automatily created in the `/src` folder next to the `app.js` file.
A login or sign up attempt should now be logged.

## Project status

The API is ready to be used in a production environment. However, further improvements will be made and pushed to this repo.

## License

This project is not yet licensed.
