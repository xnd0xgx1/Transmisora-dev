import { BaseRepository } from '../base/BaseRepository';
import Catalog from '../../models/catalogs/Catalog';

export default class CatalogRepository extends BaseRepository<typeof Catalog> {

    getAllByDiscriminator = async (discriminator: string) => {
        return await Catalog.find({ discriminator: discriminator });
    }
}
