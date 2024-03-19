import { Schema, model } from 'mongoose';
import IRegisters from '../interfaces/IRegisters';

const schema = new Schema<IRegisters>({
    process_id: { type: String, require: false },
    account_id: { type: String, require: false },
    client_id: { type: String, require: false },
    flow_id: { type: String, require: false },
    status: { type: String, require: false },
    validations: { type: Schema.Types.Mixed, required: false },
    extras: { type: Schema.Types.Mixed, required: false },
}, { timestamps: true });

const Registers = model<IRegisters>('registers', schema, 'registers');
export default Registers;
