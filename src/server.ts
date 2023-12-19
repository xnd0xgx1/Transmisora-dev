import App from './app';
import UserController from './controllers/UserController';
import LogsController from './controllers/LogsController';
import HomeController from './controllers/HomeController';
import CatalogController from './controllers/catalogs/CatalogController';
import VerifyController from './controllers/VerifyController';
import CountryController from './controllers/catalogs/CountryController';
import UploadController from './controllers/UploadController';
import AuctionController from './controllers/AuctionController';
import ExchangeRateController from './controllers/ExchangeRateController';
import DeviceController from './controllers/DeviceController';
import SystemController from './controllers/SystemController';

const app = new App(
    [
        new AuctionController(),
        new CatalogController(),
        new CountryController(),
        new DeviceController(),
        new ExchangeRateController(),
        new HomeController(),
        new LogsController(),
        new UploadController(),
        new UserController(),
        new VerifyController(),
        new SystemController(),
    ],
    Number(process.env.PORT) || 4000,
);

const server = app.listen();
module.exports = server;
