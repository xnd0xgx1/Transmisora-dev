import { BaseRepository } from '../base/BaseRepository';
import Catalog from '../../models/catalogs/Catalog';

export default class CatalogRepository extends BaseRepository<typeof Catalog> {

    getAllByDiscriminator = async (discriminator:string,language:string) => {
        console.log("Discriminator",discriminator);
        console.log("Locale:",language);
        return await Catalog.find({ "discriminator":discriminator,"locale":language });
    }

}
