import * as express from 'express';
import BaseController from '../base/BaseController';
import BadRequestException from '../../exceptions/BadRequestException';
import CatalogService from '../../services/catalogs/CatalogService';

class CatalogController extends BaseController<CatalogService> {

    public path = '/catalogs';
    public router = express.Router();

    constructor() {
        super(new CatalogService());
        this.intializeRoutes();
    }

    private async intializeRoutes() {
        this.router.get(`${this.path}/:discriminator`, this.getByDiscriminator);
    }

    private getByDiscriminator = async (request: express.Request, response: express.Response, next: express.NextFunction) => {
        try {
            const discriminator: string = request.params.discriminator;
            console.log(discriminator);
            const res = await this.service.getAllByDiscriminator(discriminator);
            response.send(res);
        }
        catch (e) {
            next(new BadRequestException(e.message));
        }
    }
}

export default CatalogController;
