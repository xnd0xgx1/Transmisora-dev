import BaseService from "./base/BaseService";
import TransactionRepository from "../repositories/TransactionRepository";
import Transaction from "../models/Transaction";
import TransactionType from "../enums/TransactionType";
import CurrencyType from "../enums/CurrencyType";

class TransactionService extends BaseService<TransactionRepository> {

    constructor() {
        super(new TransactionRepository(Transaction));
    }

    getAllByUser = async (user: any) => {
        let transaction = await this.repository.getAllByUser(user);
        return transaction;
    }

    createTransaction = async (type: TransactionType, user: any, amount: number, currency: CurrencyType, cost: number, data: string) => {
        let transaction = {
            type,
            user,
            amount,
            currency,
            cost,
            data: 'N/D'
        }
        transaction = await this.repository.create(transaction);
        return transaction;
    }

    // CMS
    public getAll = async () => {
        const transactions = await this.repository.getAll();
        return transactions;
    }
}

export default TransactionService;
