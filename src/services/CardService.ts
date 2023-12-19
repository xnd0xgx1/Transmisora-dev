import BaseService from "./base/BaseService";
import VerifyService from "./VerifyService";
import { getMinutesPassed, getText, imageToBase64 } from "../common/Utilities";
import TextType from "../enums/TextType";
import CardRepository from "../repositories/CardRepository";
import Card from "../models/Card";

class CardService extends BaseService<CardRepository> {


    constructor() {
        super(new CardRepository(Card));
    }

    deleteUser = async (id: any) => {

        // let userDb = await this.repository.getById(id);
        // if (userDb === null)
        //     throw new Error(getText(TextType.USER_NOT_FOUND));

        // let value = undefined;

        // if (userDb.email !== undefined)
        //     value = await this.verifyService.getByValue(userDb.email);
        // else
        //     value = await this.verifyService.getByValue(`${userDb.phoneCode}${userDb.phone}`);

        // if (value !== null)
        //     await this.verifyService.delete(value._id);

        // await this.repository.delete(userDb._id);

    }
}

export default CardService;
