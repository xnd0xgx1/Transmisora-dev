import * as express from 'express';
import BillingService from '../services/BillingService';
import NotificationService from '../services/NotificationService';
import PushType from '../enums/PushType';
import PomeloService from '../services/PomeloService';

class HomeController {

    public router = express.Router();

    private billingService = new BillingService();
    private notificationService = new NotificationService();
    private pomeloService = new PomeloService();

    constructor() {
        this.intializeRoutes();
    }

    private async intializeRoutes() {
        this.router.get('/', this.home);
        this.router.get('/testPush', this.testPush);

        this.router.post('/testPomeloCreateUser', this.testPomeloCreateUser);
        this.router.post('/testPomeloCreateCard', this.testPomeloCreateCard);
        this.router.post('/testPomeloSearchCards', this.testPomeloSearchCards);
        this.router.put('/testPomeloUpdateCard/:id', this.testPomeloUpdateCard);
    }

    private home = async (request: express.Request, response: any, next: express.NextFunction) => {
        response.send('...');

        // const res = await this.billingService.createBill();
        // console.log(res);
    }

    private testPush = async (request: express.Request, response: any, next: express.NextFunction) => {

        // const deviceTokenAron = 'delWBxlfTlifkG_rHaiMKY:APA91bFTsVEny9El0mR8rIPcRxcWITqyyM68H5UJUrvhYdDn7eSJD5iQn2oJseztRRgaxi5rvI941reWzfMDVee9dGNshpUE64ccZFX57p4jh1vhNQ7iTSRwsJZhjYfB_SMStYSt74z1';

        // const user = {
        //     'deviceToken': deviceTokenAron
        // }
        // const data = {
        //     action: PushType.ADD_FUNDS
        // };
        // await this.notificationService.sendNotifications(user, 'test title', 'test body', data);

        // const deviceToken = 'fG7XCuhfKUmhuqiFsApTvK:APA91bHIr9vyeZ_z20vRBJL5kOnxcQH2SB5-Gs2ACTkWgMYHGhHqi0wv8WVHegiytbU1Mpz_WLC35JVRG5ilpE2TM4m3Whnk2-m0K0zGgdjWkQQhyihCRtl-ENrNtQ6sYHlqApell_J4';

        // // const user = {
        // //     'deviceToken': deviceToken
        // // }
        // const data = {
        //     action: PushType.ADD_FUNDS
        // };
        // await this.notificationService.sendPushNotification(deviceToken, 'test title', 'test body', data);
        response.send('...');
    }

    private testPomeloCreateUser = async (request: express.Request, response: any, next: express.NextFunction) => {
        const data = request.body;
        const card = await this.pomeloService.createUser(data);
        response.send(card);
    }

    private testPomeloCreateCard = async (request: express.Request, response: any, next: express.NextFunction) => {
        const data = request.body;
        const card = await this.pomeloService.createCard(data);
        response.send(card);
    }

    private testPomeloSearchCards = async (request: express.Request, response: any, next: express.NextFunction) => {
        const data = request.body;
        const card = await this.pomeloService.testPomeloSearchCards(data.shipment_id);
        response.send(card);
    }

    private testPomeloUpdateCard = async (request: express.Request, response: any, next: express.NextFunction) => {
        const id = request.params.id;
        const data = request.body;
        const card = await this.pomeloService.updateCard(id, data);
        response.send(card);
    }
}

export default HomeController;
