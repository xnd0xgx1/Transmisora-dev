import Bill from '../models/Bill';
import { BaseRepository } from './base/BaseRepository';

class BillingRepository extends BaseRepository<typeof Bill> {
}

export default BillingRepository;
