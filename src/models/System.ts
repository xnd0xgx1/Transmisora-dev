import { Schema, model } from 'mongoose';
import IAuction from '../interfaces/IAuction';
import IBase from '../interfaces/IBase';

const schema = new Schema<IBase>({
    usuariosActivos: { type: Number },
    usuariosDeBaja: { type: Number },
    usuariosBloqueados: { type: Number },
    tcUsuariosActivos: { type: Number },
    tcOperacionesActivas: { type: Number },
    documentosRecibidos: { type: Number },
    documentosRechazados: { type: Number },
}, { timestamps: true });

const System = model<IAuction>('System', schema, 'system');
export default System;
