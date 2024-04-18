import { Schema, model } from 'mongoose';
import IDictionary from '../interfaces/IDictionary';

const schema = new Schema<IDictionary>({
    statusid: { type: Number, require: false },
    statusstr: { type: String, require: false },
    statusdesc: { type: String, require: false },
}, { timestamps: true ,strict:false});

const DictionaryStatus = model<IDictionary>('StatusDictionary', schema, 'StatusDictionary');
export default DictionaryStatus;
