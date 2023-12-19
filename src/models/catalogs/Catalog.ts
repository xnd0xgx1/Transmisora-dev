import { Schema, model } from 'mongoose';
import ICatalog from '../../interfaces/catalogs/ICatalog';

const schema = new Schema<ICatalog>({
    createdAt: { type: Date, default: Date.now },
    // isActive: { type: Boolean, default: false },
    discriminator: { type: String },
    name: { type: String },
    locale: { type: String, default: 'es' }
});

const Catalog = model<ICatalog>('Catalog', schema);
export default Catalog;
