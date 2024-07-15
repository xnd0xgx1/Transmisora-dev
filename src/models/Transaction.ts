import { Schema, model } from 'mongoose';
import ITransaction from '../interfaces/ITransaction';

const schema = new Schema<ITransaction>({
    type: { type: String, required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    currency: { type: String, required: true },
    cost: { type: Number, required: true },
    claveRastreo:  { type: String, required: true },
    conceptoPago:  { type: String, required: true },
    cuentaOrdenante: { type: String, required: true },
    cuentaBeneficiario: { type: String, required: true },
    institucionContraparte: { type: String, required: false,default: "" },
    institucionOperante: { type: String, required: false,default: "" },
    monto: { type: Number, required: true },
    nombreBeneficiario: { type: String, required: true }, 
    nombreOrdenante: { type: String, required: true },
    referenciaNumerica: { type: String, required: true },
    rfcCurpBeneficiario: { type: String, required: true },
    rfcCurpOrdenante: { type: String, required: true },
    tipoCuentaBeneficiario: { type: String, required: true },
    tipoCuentaOrdenante: { type: String, required: true },
    tipoPago: { type: String, required: true },
    latitud: { type: String, required: false,default: "0.0" },
    longitud: { type: String, required: false,default: "0.0"},
    status: { type: String, default: "PENDING" },
    createdAt: { type: Date, default: Date.now },
    idSTP:{ type: String, required: false },
    cep: { type: Schema.Types.Mixed, required: false }

}, { timestamps: true });

const Transaction = model<ITransaction>('Transaction', schema, 'transactions');
export default Transaction;
