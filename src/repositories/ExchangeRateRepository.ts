import ExchangeRate from '../models/ExchangeRate';
import { BaseRepository } from './base/BaseRepository';

class ExchangeRateRepository extends BaseRepository<typeof ExchangeRate> {
}

export default ExchangeRateRepository;
