import { MSG_EMAIL_ALREADY_REGISTERED, MSG_PHONE_ALREADY_REGISTERED, MSG_WRONG_ACCESS_DATA } from "../../common/messages";
import User from "../../models/User";
import UserRepository from "../../repositories/UserRepository";
import BaseService from "../base/BaseService";
import * as bcrypt from 'bcrypt';
import LoginDto from "../../dto/LoginDto";
import { SECRET, TOKEN_EXPIRES } from "../../common/constants";
import * as jwt from 'jsonwebtoken';
import TokenData from "../../interfaces/tokenData.interface";
import DataStoredInToken from "../../interfaces/dataStoredInToken";
import Role from "../../enums/Role";
import RegisterWithEmailDto from "../../dto/RegisterWithEmailDto";
import RegisterWithPhoneDto from "../../dto/RegisterWithPhoneDto";
import CatalogRepository from "../../repositories/catalogs/CatalogRepository";
import Catalog from "../../models/catalogs/Catalog";

class CatalogService extends BaseService<CatalogRepository> {

    constructor() {
        super(new CatalogRepository(Catalog));
    }

    getAllByDiscriminator = async (discriminator: string) => {
        return await this.repository.getAllByDiscriminator(discriminator);
    }
}

export default CatalogService;
