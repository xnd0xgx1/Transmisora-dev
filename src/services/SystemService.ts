import SettingsPayment from "../models/SettingsPayment";
import SettingsTime from "../models/SettingsTime";
import SettingsWithdrawal from "../models/SettingsWithdrawal";
import System from "../models/System";
import SettingsPaymentRepository from "../repositories/SettingsPaymentRepository";
import SettingsTimeRepository from "../repositories/SettingsTimeRepository";
import SettingsWithdrawalRepository from "../repositories/SettingsWithdrawalRepository";
import SystemRepository from "../repositories/SystemRepository";
import BaseService from "./base/BaseService";

class SystemService extends BaseService<SystemRepository> {

    private settingsPaymentRepository = new SettingsPaymentRepository(SettingsPayment);
    private settingsWithdrawalRepository = new SettingsWithdrawalRepository(SettingsWithdrawal);
    private settingsTimeRepository = new SettingsTimeRepository(SettingsTime);

    constructor() {
        super(new SystemRepository(System));
    }

    get = async () => {
        let all = await this.repository.getAll();
        return all[0];
    }

    getPayment = async () => {
        let datasDb = await this.settingsPaymentRepository.getAll();
        return datasDb[0];
    }

    setPayment = async (data: any) => {
        const datasDb = await this.settingsPaymentRepository.getAll();
        let dataDb: any = datasDb[0];
        dataDb.amount = data.amount;
        dataDb.admin = data.admin;
        dataDb.date = Date();
        dataDb = await this.settingsPaymentRepository.update(dataDb);
        return dataDb;
    }

    getWithdrawal = async () => {
        let datasDb = await this.settingsWithdrawalRepository.getAll();
        return datasDb[0];
    }

    setWithdrawal = async (data: any) => {
        const datasDb = await this.settingsWithdrawalRepository.getAll();
        console.log(datasDb)
        console.log(data)
        let dataDb: any = datasDb[0];
        dataDb.depositoMin = data.depositoMin;
        dataDb.depositoMax = data.depositoMax;
        dataDb.withdrawalMin = data.withdrawalMin;
        dataDb.withdrawalMax = data.withdrawalMax;
        dataDb.admin = data.admin;
        dataDb = await this.settingsWithdrawalRepository.update(dataDb);
        return dataDb;
    }

    getTime = async () => {
        let datasDb = await this.settingsTimeRepository.getAll();
        return datasDb[0];
    }

    setTime = async (data: any) => {
        const datasDb = await this.settingsTimeRepository.getAll();
        console.log(datasDb)
        console.log(data)
        let dataDb: any = datasDb[0];
        dataDb.hours = data.hours;
        dataDb.minutes = data.minutes;
        dataDb.seconds = data.seconds;
        dataDb = await this.settingsTimeRepository.update(dataDb);
        return dataDb;
    }
}

export default SystemService;
