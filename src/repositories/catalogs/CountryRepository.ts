import { BaseRepository } from '../base/BaseRepository';
import Country from '../../models/catalogs/Country';

export default class CountryRepository extends BaseRepository<typeof Country> {
    getById(id: string): Promise<typeof Country> {
        return this.collection.findById(id);
    }
}
