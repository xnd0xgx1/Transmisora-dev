import AWS from 'aws-sdk';
import NotificationRepository from '../repositories/NotificationRepository';
import Notification from '../models/Notification';
import * as dotenv from 'dotenv';
dotenv.config();
AWS.config.update(
    {
        region: process.env.AWS_REGION,
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_ACCESS_KEY,
        },
    }
);
const admin = require("firebase-admin");
const fcm = require('fcm-notification');
// const serviceAccount = require("../firebase-key.json");
const serviceAccount = {
    "type": "service_account",
    "project_id": "uexchange-7750c",
    "private_key_id": "32a7563ca76663271eb60dc7c65256225c3c76b8",
    "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQC15WuIPQkRZu5t\nhNuonXr7VcBEtlf//lhLfqVe5qz0EUgup7DY6NJDJwNUVhz9YiQ/AnPp2EJnw4IQ\nCX61B+yE1f+Ze2V4JKaUG6b871ELLkdcN1eodOgu1i5d07cCTcHE25/0ligNNfxz\neU6qUKM6n9weeSdBKn1bUGaSWuQgcWR00WRF+t8uW5pPLRjurAKwfSmoNZiKFrVO\nalVbQnP5alsB9LaQyhFVMoTdJOdPf17J5R+7o/fKiZ0lG6Ub4HkNyHDYqngw2vZ2\njG+ESeRzCJDfyr2sDCuUn/s3KB6zjYIR4EV3QYSFg8NY7vZ++eqy0V4cNhvcYRRM\ns4ZecfbvAgMBAAECggEABuH5Ttc/ERgBJ0a9iGSmbdKMVcKak4FcdkWCshPDcUbN\ndup50B4F2sGj/XHMDgXD063e6fcjaB68kf5x+3KjJKbzptXwUc/9N6HQ5fA+SPsw\nJbv4W/5JzNU7kumlxUy2QMyDVx4ZbN/hP2ip19r474keAKSFSOYihoKFJxORCe3V\nfRPhCmF9NdlR4+QS6BJGJMts5rUeSwWV/RPxtxAiO9ggmKB1r8y1Z98rQ4FBa/Bp\nlPtpxqhCYSF6e9UE9vNWqUbNKEJnHC3hZkN/ai2/CPjU7VgqaQaiv6GcEsKgIsZW\n9zkDMh+oNB4w9rVli5cgZln8denxSagwdv/KZ5S2JQKBgQDYuYIynyo6/6nBOi/A\nIU0vXDHTjW5Vxhh60ZPBhhxppVNw/Wbqw/RhEApayfkOeY3HmimRiq3JF2kpKoU1\nligq9Q2652A7PMeF5jtw8PXNgU2iOrFmx/QuLT0x9GKRNcC8LiFlveZyrNcTEZdU\nzyToEBKslXkuJ4O8Foy8h1S+9QKBgQDW3B3ajEf4DvtgamJP7Sonk8rgnK1z2wJf\nuHZIXmUaJH8QniiPrLkSZtrLbUqeMlZB7VZX72e8EjObrJhQlwyIDMaA1xjazhZW\n3HGmMKfgFoMTlYS6D4hhyY7CaMZ1RsMc9cMQMemQ4VtiZmDPb//RiJq4EyCYnYCC\nMMqcjTRn0wKBgQCZg13cKa4qOGqwOl0UhQI9Z9rLdUUQcM9qQAWfcTWzB66BPJ2n\n8cGq90e+Y46NWEC7gFGtjEPpSzHsPPg6qvAs7YQaPkaF71mNWTYFnEkgllS9c0Gy\nAjTOeLD+L5OaNC8fnLV/cfJIjHGUSkOdiVUlJC12HjLGJKtFkduCt4Gp+QKBgQDD\nHsqNum9xOknW2UXGx95Mas8HA8IRQIb7Xo0sU20FPLeX48l6EKVRrM5thycIWzYy\nUNLksKlIBk+PxEHejg33T4LFZpFPw3BOGYusHOuXeVo34sTSI2D7TQu0SWpQ/p4a\nIqWug2VVCRLwXYD1YQS0yJWZLOWhMweNM7oMSb+ZuQKBgQDQDsHFlOBSxQMmctDd\n2OxJ9LFktjkP1Y9jpPtYulJpvAXNu2wG3A41imSZ3mXVlgHQc3MhfKrwKZbSIJxv\n5RbAyvB+A7l5QvhQpicF+x51DqwJoI+7Y5vfHJc0wV+2qtrFhD2rRO/l4FBNinIh\nzILQiMA09LMEXY4HNlczw8Y3Tg==\n-----END PRIVATE KEY-----\n",
    "client_email": "firebase-adminsdk-fuint@uexchange-7750c.iam.gserviceaccount.com",
    "client_id": "111852715708600137505",
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fuint%40uexchange-7750c.iam.gserviceaccount.com",
    "universe_domain": "googleapis.com"
}
const certPath = admin.credential.cert(serviceAccount);
const FCM = new fcm(certPath);

class NotificationService {

    private notificationRepository = new NotificationRepository(Notification);

    sendEmail = async (email: string, code: any) => {
        AWS.config.region = "us-east-2";
        const message = "Trasmisora, tu código de verificación es: " + code;
        console.log("EMAIL GENERATION");
        console.log(email,code);
        var params = {
            Destination: {
                ToAddresses: [
                    email
                ]
            },
            Message: {
                Body: {
                    Html: {
                        Charset: "UTF-8",
                        Data: message
                    },
                    Text: {
                        Charset: "UTF-8",
                        Data: message
                    }
                },
                Subject: {
                    Charset: 'UTF-8',
                    Data: 'Trasmisora, tu código de verificación'
                }
            },
            Source: 'notificaciones@trasmisora.com',
        };

        var sendPromise = new AWS.SES({ apiVersion: '2010-12-01' }).sendEmail(params).promise();

        sendPromise.then(
            function (data) {
                console.log(data.MessageId);
            }).catch(
                function (err) {
                    console.error(err, err.stack);
                });
    }


    sendEmail2 = async (email: string, code: any) => {
        AWS.config.region = "us-east-2";
        const message = "Ingresa para realizar el registro: " + code;
        console.log("EMAIL GENERATION");
        console.log(email,code);
        var params = {
            Destination: {
                ToAddresses: [
                    email
                ]
            },
            Message: {
                Body: {
                    Html: {
                        Charset: "UTF-8",
                        Data: message
                    },
                    Text: {
                        Charset: "UTF-8",
                        Data: message
                    }
                },
                Subject: {
                    Charset: 'UTF-8',
                    Data: 'Trasmisora, ingresa para el registro'
                }
            },
            Source: 'notificaciones@trasmisora.com',
        };

        var sendPromise = new AWS.SES({ apiVersion: '2010-12-01' }).sendEmail(params).promise();

        sendPromise.then(
            function (data) {
                console.log(data.MessageId);
            }).catch(
                function (err) {
                    console.error(err, err.stack);
                });
    }


    sendEmailGeneric = async (email: string, content: any,asunto: string) => {
        AWS.config.region = "us-east-2";
        const message = "" + content;
        console.log("EMAIL GENERATION");
        console.log(email,content);
        var params = {
            Destination: {
                ToAddresses: [
                    email
                ]
            },
            Message: {
                Body: {
                    Html: {
                        Charset: "UTF-8",
                        Data: message
                    },
                    Text: {
                        Charset: "UTF-8",
                        Data: message
                    }
                },
                Subject: {
                    Charset: 'UTF-8',
                    Data: asunto
                }
            },
            Source: 'notificaciones@trasmisora.com',
        };

        var sendPromise = new AWS.SES({ apiVersion: '2010-12-01' }).sendEmail(params).promise();

        sendPromise.then(
            function (data) {
                console.log(data.MessageId);
            }).catch(
                function (err) {
                    console.error(err, err.stack);
                });
    }



    sendSMS = async (phoneNumber: string, code: any) => {
        try {
            AWS.config.region = "us-east-1";
            const params: any = {
                Message: "Trasmisora, tu código de verificación es: " + code,
                PhoneNumber: phoneNumber,
            };
            console.log("PARAMS SMS: ",params);
            return new AWS.SNS({ apiVersion: "2010-03-31" }).publish(params).promise()
                .then(message => {
                    console.log("OTP SEND SUCCESS");
                })
                .catch(err => {
                    console.log(err)
                    return err;
                });
        } catch (ex) {
            console.log(ex);
        }
    }

    sendSMSGeneric = async (phoneNumber: string, content: any) => {
        try {
            console.log("TRYING TO SEND SMS");
            AWS.config.region = "us-east-1";
            const params: any = {
                Message: content,
                PhoneNumber: phoneNumber,
            };
        
            return new AWS.SNS({ apiVersion: "2010-03-31" }).publish(params).promise()
                .then(message => {
                    console.log("OTP SEND SUCCESS");
                })
                .catch(err => {
                    console.log(err)
                    return err;
                });
        } catch (ex) {
            console.log(ex);
        }
    }

    sendSMS2 = async (phoneNumber: string, code: any) => {
        try {
            AWS.config.region = "us-east-1";
            const params: any = {
                Message: "Ingresa para realizar el registro: " + code,
                PhoneNumber: phoneNumber,
            };

            console.log("PARAMS SMS: ",params);

            return new AWS.SNS({ apiVersion: "2010-03-31" }).publish(params).promise()
                .then(message => {
                    console.log("OTP SEND SUCCESS");
                })
                .catch(err => {
                    console.log(err)
                    return err;
                });
        } catch (ex) {
            console.log(ex);
        }
    }

    sendNotifications = async (user: any, title: string, body: string, data: any) => {
        try {

            // Save.
            await this.save(user, title, body);

            // Send push notification.
            // Get all user devices.
            for (let i = 0; i < user.devices.length; i++) {
                const device = user.devices[i];
                const isIphone = device.info.toLowerCase() === 'iphone' ? true : false;
                if(device.isVerify)
                    await this.sendPushNotification(isIphone, device.deviceToken, title, body, data);
            }

            // Send email.
            await this.sendInfoEmail(user.email, title, body);
        }
        catch (err) {
            console.log(err);
            throw err;
        }
    }

    sendInfoEmail = async (email: any, subject: any, message: string) => {
        AWS.config.region = "us-east-2";
        if (email === undefined)
            return;

        const params = {
            Destination: {
                ToAddresses: [
                    email
                ]
            },
            Message: {
                Body: {
                    Html: {
                        Charset: "UTF-8",
                        Data: message
                    },
                    Text: {
                        Charset: "UTF-8",
                        Data: message
                    }
                },
                Subject: {
                    Charset: 'UTF-8',
                    Data: subject
                }
            },
            Source: 'notificaciones@trasmisora.com',
        };

        const sendPromise = new AWS.SES({ apiVersion: '2010-12-01' }).sendEmail(params).promise();

        sendPromise.then(
            function (data) {
                console.log(data.MessageId);
            }).catch(
                function (err) {
                    console.error(err, err.stack);
                });
    }

    sendPushNotification = (isIphone: boolean, token: any, title: string, body: string, data: any) => {
        try {
            if (token === undefined)
                return;

            if (token === '')
                return;

            let message: any = {
                token,
                data: {
                    ...data,
                    title,
                    body,
                }
            };

            if (isIphone) {
                message = {
                    token,
                    notification: {
                        body,
                        title
                    }
                }
            }

            console.log(JSON.stringify(message, undefined, 4));

            FCM.send(message, function (err, resp) {
                if (err) {
                    throw err;
                } else {
                    console.log('Successfully sent notification');
                }
            });
        }
        catch (err) {
            console.log(err);
            throw err;
        }
    }

    getById = async (id: any) => {
        return await this.notificationRepository.getById(id);
    }

    update = async (notification: any) => {
        return await this.notificationRepository.update(notification);
    }

    delete = async (notificationId: any) => {
        return await this.notificationRepository.delete(notificationId);
    }

    getAllByUser = (user: any) => {
        return this.notificationRepository.getAllByUser(user);
    }

    getAllSystem = () => {
        return this.notificationRepository.getAllSystem();
    }

    private async save(user: any, title: string, body: string) {
        const notification: any = {
            user,
            title,
            body
        }
        await this.notificationRepository.create(notification);
    }
}

export default NotificationService;
