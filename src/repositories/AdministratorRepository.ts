import Administrator from '../models/Administrator';
import { BaseRepository } from './base/BaseRepository';

class AdministratorRepository extends BaseRepository<typeof Administrator> {
}

export default AdministratorRepository;
