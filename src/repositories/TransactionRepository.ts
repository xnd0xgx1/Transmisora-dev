import { BaseRepository } from './base/BaseRepository';
import Transaction from '../models/Transaction';

class TransactionRepository extends BaseRepository<typeof Transaction> {
    getAllByUser = async (user: any) => {
        return await Transaction.find({ user: user });
    }

    getAll(): Promise<typeof Transaction[]> {
        return this.collection.find().populate('user', 'email phone');
    }
    getbySTPID(idstp:string): Promise<typeof Transaction[]> {
        return this.collection.findOne({idSTP: idstp}).populate('user');
    }

    getbyclabeandrastreo(clabe:string,rastreo:string): Promise<typeof Transaction[]> {
        return this.collection.findOne({cuentaBeneficiario: clabe,claveRastreo:rastreo}).populate('user');
    }

    getallbyday(start,end): Promise<typeof Transaction[]> {
        return this.collection.find({
            createdAt: {
                $gte: start,
                $lt: end
            }
        }).populate('user').exec();
    }
}

export default TransactionRepository;
