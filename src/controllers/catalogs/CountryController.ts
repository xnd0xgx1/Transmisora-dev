import * as express from 'express';
import BaseController from '../base/BaseController';
import CountryService from '../../services/catalogs/CountryService';

class CountryController extends BaseController<CountryService> {

    public path = '/countries';
    public router = express.Router();

    constructor() {
        super(new CountryService());
        this.intializeRoutes();
    }

    private async intializeRoutes() {
        this.router.get(this.path, this.getAll);
        this.router.get(`${this.path}/:id`, this.getById);
    }

    // getAll = async (request: express.Request, response: express.Response, next: express.NextFunction) => {
    //     try {
    //         const discriminator: string = request.params.discriminator;
    //         console.log(discriminator);
    //         const res = await this.service.getAllByDiscriminator(discriminator);
    //         response.send(res);
    //     }
    //     catch (e) {
    //         next(new BadRequestException(e.message));
    //     }
    // }
}

export default CountryController;
