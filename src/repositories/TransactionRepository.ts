import { BaseRepository } from './base/BaseRepository';
import Transaction from '../models/Transaction';

class TransactionRepository extends BaseRepository<typeof Transaction> {
    getAllByUser = async (user: any) => {
        return await Transaction.find({ user: user });
    }

    getAll(): Promise<typeof Transaction[]> {
        return this.collection.find().populate('user', 'email phone');
    }
}

export default TransactionRepository;
