import cookieParser from 'cookie-parser';
import express from 'express';
import * as bodyParser from 'body-parser';
import mongoose from 'mongoose';
import errorMiddleware from './middleware/error.middleware';
import cron from 'node-cron';
import cors from 'cors';
var pathToRegexp = require('path-to-regexp')

import * as dotenv from 'dotenv';
import i18NMiddleware from './middleware/i18n.middleware';
import AuctionService from './services/AuctionService';
dotenv.config();

class App {

    public app: express.Application;
    public port: number;

    constructor(controllers, port) {
        this.app = express();
        this.port = port;

        this.connectToTheDatabase();
        this.initializeMiddlewares();
        this.initializeControllers(controllers);
        this.initializeErrorHandling();
        this.initializeCronJob();
    }

    private connectToTheDatabase() {

        const server = process.env.DB_HOST;
        const user = process.env.DB_USERNAME;
        const pass = process.env.DB_PASSWORD;
        const db = process.env.DB_DATABASE;

        mongoose.connect(`mongodb+srv://${user}:${pass}@${server}/${db}?retryWrites=true&w=majority`, {
            useCreateIndex: true,
            useNewUrlParser: true,
            useUnifiedTopology: true
        }, () => {
            console.log('Connected to database');
        });
    }

    private initializeMiddlewares() {
        this.app.use(bodyParser.raw());
        this.app.use(bodyParser.text());
        this.app.use(bodyParser.text({ type: 'application/jwt' }))
        this.app.use(bodyParser.json());
        this.app.use(cookieParser());
        this.app.use(i18NMiddleware());

        this.app.use(cors());
        var allowedOrigins = [
            'http://localhost:3000',
            'http://localhost:3001',
            'http://localhost:5173',
            'https://orange-mud-01409780f.4.azurestaticapps.net',
            'http://uexchangecmsstage-enuexchangecmsstagev.eba-hbd2mpyw.us-east-2.elasticbeanstalk.com'
        ];
        this.app.use(this.except(['/payments/oxxoPayHook'], cors({
            origin: function (origin, callback) {
                if (!origin) return callback(null, true);
                if (allowedOrigins.indexOf(origin) === -1) {
                    var msg = 'The policy for this site does not allow access.';
                    return callback(new Error(msg), false);
                }
                return callback(null, true);
            }
        })));

        // // TODO: Disable in production.
        // let upload = new multer({ dest: './uploads' });
        // this.app.use(upload.any());
    }

    private except(path, fn) {
        var regexp = pathToRegexp(path)
        return function (req, res, next) {
            if (regexp.test(req.path)) return next()
            else return fn(req, res, next)
        }
    }

    private initializeControllers(controllers) {
        controllers.forEach((controller) => {
            this.app.use('/', controller.router);
        });
    }

    private initializeErrorHandling() {
        this.app.use(errorMiddleware);
    }

    private initializeCronJob() {
        const auctionService = new AuctionService();
        cron.schedule('*/1 * * * *', async () => {
            console.log('Cronjob: Close active auctions')
            await auctionService.execute();
        });
    }

    public listen() {
        this.app.listen(this.port, () => {
            console.log(`App listening on the port ${this.port}`);
        });
    }
}

export default App;
