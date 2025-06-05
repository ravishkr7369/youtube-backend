import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
const app = express();


// middlewares
app.use(cors({
	origin: process.env.CORS_ORIGIN,
	credentials: true,
}));
app.use(express.urlencoded({ extended: true ,limit:"16kb"}));
app.use(express.json({limit:"16kb"}));
app.use(express.static('public'));
app.use(cookieParser());

// import routes
import userRoutes from './routes/user.routes.js';
import videoRoutes from './routes/video.route.js';
import likeRoutes from './routes/like.routes.js';
import commentRoutes from './routes/comment.route.js';
import subscriptionRoutes from './routes/subscription.route.js';
import playlistRoutes from './routes/playlist.route.js';



app.use('/api/v1/users', userRoutes);
app.use('/api/v1/videos', videoRoutes);
app.use('/api/v1/likes', likeRoutes);
app.use("/api/v1/comments", commentRoutes)
app.use("/api/v1/subscriptions", subscriptionRoutes)
app.use("/api/v1/playlists", playlistRoutes)

export {app}