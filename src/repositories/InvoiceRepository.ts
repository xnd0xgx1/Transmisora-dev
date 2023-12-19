import { BaseRepository } from './base/BaseRepository';
import Invoice from '../models/Invoice';

class InvoiceRepository extends BaseRepository<typeof Invoice> {
    getAllByUser = async (user: any) => {
        return await Invoice.find({ user: user });
    }
}

export default InvoiceRepository;
