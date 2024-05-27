import { Schema, model } from 'mongoose';
import IRegisters from '../interfaces/IRegisters';

const schema = new Schema<IRegisters>({
    process_id: { type: String, require: false },
    account_id: { type: String, require: false },
    client_id: { type: String, require: false },
    initialurl:{ type: String, require: false },
    flow_id: { type: String, require: false },
    status: { type: String, require: false },
    Truora: { type: Schema.Types.Mixed, required: false },
    ZapSign: { type: Schema.Types.Mixed, required: false },
    data_obtenida: { type: Schema.Types.Mixed, required: false }
}, { timestamps: true ,strict:false});

const Registers = model<IRegisters>('registers', schema, 'registers');
export default Registers;


const preregisterschema = new Schema<IRegisters>({
    phoneCode: { type: String, require: false },
    phone: { type: String, require: false },
    email: { type: String, require: false },
    tipo: { type: Number, require: false },
}, { timestamps: true ,strict:false});

export const Preregisters = model<IRegisters>('preregisters', preregisterschema, 'preregisters');

