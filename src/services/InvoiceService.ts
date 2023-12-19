import BaseService from "./base/BaseService";
import Invoice from "../models/Invoice";
import InvoiceRepository from "../repositories/InvoiceRepository";

class InvoiceService extends BaseService<InvoiceRepository> {

    constructor() {
        super(new InvoiceRepository(Invoice));
    }

    getAllByUser = async (user: any) => {
        let invoices = await this.repository.getAllByUser(user);
        return invoices;
    }

    createInvoice = async (user: any, businessName: string, email: string, data: string) => {

        // TODO: Validar si ya se ha facturado.

        let invoice = {
            user,
            businessName,
            email,
            data
        }
        invoice = await this.repository.create(invoice);
        return invoice;
    }
}

export default InvoiceService;
