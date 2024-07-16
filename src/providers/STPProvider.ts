const fs = require('fs');
const crypto = require('crypto');
var request = require('request');

const axios = require('axios');

class StpProvider {

    constructor() {

    }

    getSignAltaOrden = async (ordenPagoWs) => {
        let cadenaOriginal = "";
        cadenaOriginal = "||" +
        ordenPagoWs['institucionContraparte'] + "|" + //a
        ordenPagoWs['empresa'] + "|" + //b
        "||" + //cd
        ordenPagoWs['claveRastreo'] + "|" + //e
        ordenPagoWs['institucionOperante'] + "|" + //f
        (ordenPagoWs['monto']).toFixed(2) + "|" + //g
        ordenPagoWs['tipoPago'] + "|||"; //h
        if (ordenPagoWs['nombreOrdenante']) {
            cadenaOriginal = cadenaOriginal + ordenPagoWs['nombreOrdenante'] + "|"; //j
        }
        if (ordenPagoWs['cuentaOrdenante']) {
            cadenaOriginal = cadenaOriginal + ordenPagoWs['cuentaOrdenante'] + "|"; //k
        }
        if (ordenPagoWs['rfcCurpOrdenante']) {
            cadenaOriginal = cadenaOriginal + ordenPagoWs['rfcCurpOrdenante'] + "|"; //l
        }
        cadenaOriginal = cadenaOriginal + "|" +
                ordenPagoWs['tipoCuentaBeneficiario'] + "|" + //m
                ordenPagoWs['nombreBeneficiario'] + "|" + //n
                ordenPagoWs['cuentaBeneficiario'] + "|" + //o
                ordenPagoWs['rfcCurpBeneficiario'] + "||||||" + //pqrstu
                ordenPagoWs['conceptoPago'] + "||||||" + //vwxyzaa
                ordenPagoWs['referenciaNumerica'] + "||" + //bbcc
                 "||||||"; //ddeeffgghh

        console.log("cadenaOriginal: ",cadenaOriginal);
        var sign = crypto.createSign('RSA-SHA256');
        sign.update(cadenaOriginal);
        sign.end();
        const key = fs.readFileSync('src/providers/ssl/llavePrivadatim2.pem');
        let signature_b64 = sign.sign(key, 'base64');
        return signature_b64;
    }

    getSignRegistroFisica= async (ordenPagoWs) => {
     
        let cadenaOriginal = "";
        cadenaOriginal = "||" +
        ordenPagoWs['empresa'] + "|" + //b
        ordenPagoWs['cuenta'] + "|" + //cd
        ordenPagoWs['rfcCurp'] + "||"; //ddeeffgghh
       
        var sign = crypto.createSign('RSA-SHA256');
        sign.update(cadenaOriginal);
        sign.end();
        const key = fs.readFileSync('src/providers/ssl/llavePrivadatim2.pem');
        let signature_b64 = sign.sign(key, 'base64');
        return signature_b64;
    }


    calcularDigitoVerificador = async (cuenta) => {

        const ponderaciones = [3, 7, 1, 3, 7, 1, 3, 7, 1, 3, 7, 1, 3, 7, 1, 3, 7];
    let suma = 0;

    // Paso 1 y 2: Multiplicar cada dígito por su factor de ponderación y tomar módulo 10
    for (let i = 0; i < cuenta.length; i++) {
        const digito = parseInt(cuenta[i], 10);
        const ponderacion = ponderaciones[i];
        const resultado = (digito * ponderacion) % 10;
        suma += resultado;
    }
    const moduloSuma = suma % 10;

    const B = 10 - moduloSuma;

    const digitoVerificador = B % 10;

    const clabe = cuenta + digitoVerificador.toString();

    return clabe;
    }

    registroPFStp = async (bodydata) => {

            
          let config = {
            method: 'put',
            url: 'https://demo.stpmex.com:7024/speiws/rest/cuentaModule/fisica',
            headers: { 
              'Content-Type': 'application/json'
            },
            data : JSON.stringify(bodydata)
          };
          
        const result = await axios.request(config);
        return result.data;
    }

    registroOrdenIndirecto = async (bodydata) => {

            
        let config = {
          method: 'put',
          url: 'https://demo.stpmex.com:7024/speiws/rest/ordenPago/registra',
          headers: { 
            'Content-Type': 'application/json'
          },
          data : JSON.stringify(bodydata)
        };
        
      const result = await axios.request(config);
      return result.data;
  }
  
    
  

}

export default StpProvider;
