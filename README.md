# YouTube Backend Clone

YouTube Backend Clone is a feature-rich video-sharing backend built with Node.js, Express.js, MongoDB, and Cloudinary.

## Features

- User authentication and authorization using JWT.
- Video upload and management with Cloudinary.
- Playlist creation and management.
- Like, dislike, and comment functionality.
- RESTful API design with MVC architecture.
- Scalable, modular codebase using Mongoose for MongoDB integration.

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB + Mongoose
- **Auth**: JSON Web Tokens (JWT)
- **Media**: Cloudinary (video hosting)
- **API Testing**: Postman / Thunderclient

## Folder Highlights

- `/controllers`: Business logic for each route
- `/models`: Mongoose models for user, video, playlist, etc.
- `/routes`: Route handlers grouped by feature
- `/middlewares`: Auth, error handlers, and validators
- `/utils`: Helper functions for reusable logic

## How to Use

1. Clone the repo and navigate to `Backend/src`.
2. Run `npm install`.
3. Add your `.env` configuration (Mongo URI, JWT secret, Cloudinary keys).
4. Start the server with `npm start`.

## Author

**Ravish Kumar**  
📧 ravishkr7369@gmail.com  
🔗 [LinkedIn](https://linkedin.com/in/ravishkr1105)  
💻 [GitHub](https://github.com/ravishkr7369)
