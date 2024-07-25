import BaseService from "./base/BaseService";
import TransactionRepository from "../repositories/TransactionRepository";
import Transaction from "../models/Transaction";
import TransactionType from "../enums/TransactionType";
import CurrencyType from "../enums/CurrencyType";
import UserService from "./UserService";

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

    createTransactionSTP = async (transactionobj:any) => {
        console.log("Creating transaction: ",transactionobj)
        const transaction = await this.repository.create(transactionobj);
        return transaction;
    }



    abonoSTP = async (transactionobj:any) => {
        console.log("Creating transaction: ",transactionobj)
        const transaction = await this.repository.create(transactionobj);
        return transaction;
    }

    updatecep = async (cep) => {
        let transaction = await this.repository.getbyclabeandrastreo(cep.cuentaBeneficiario,cep.claveRastreo);
        if(transaction != null){
            transaction.cep = cep;
            let retunresult = await this.repository.update(transaction);
            return retunresult;
        }else{
            throw new Error("Transaccion no localizada");
        }
       
    }
       

    changeStatus = async (id,estado,causaDevolucion) => {
        let transaction = await this.repository.getbySTPID(id);
        if(transaction != null){
            transaction.status = estado;
            let retunresult = await this.repository.update(transaction);
            return retunresult;
        }else{
            throw new Error("Transaccion no localizada");
        }
       
    }


    gettransactionNumber = async () => {
        const start = new Date();
        start.setHours(0, 0, 0, 0); // Establece la hora a medianoche
        start.setDate(start.getDate() - Math.abs(7));
    
        const end = new Date();
        end.setHours(23, 59, 59, 999);
        console.log("Date start: ",start);
        console.log("Date end: ",end);
        let transaction = await this.repository.getallbyday(start,end);
        console.log("Transaction number: ",transaction.length);
        return transaction.length;
    }

    // CMS
    public getAll = async () => {
        const transactions = await this.repository.getAll();
        return transactions;
    }
}

export default TransactionService;
