import Address from '../models/Address';
import { BaseRepository } from './base/BaseRepository';

class AddressRepository extends BaseRepository<typeof Address> {
}

export default AddressRepository;
