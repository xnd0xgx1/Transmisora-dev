import Card from "../models/Card";
import { BaseRepository } from './base/BaseRepository';

class CardRepository extends BaseRepository<typeof Card> {
}

export default CardRepository;
