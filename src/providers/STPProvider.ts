const fs = require('fs');
const crypto = require('crypto');
var request = require('request');
const path = require('path');
const filePath = path.join(__dirname, 'llavePrivadatim2.pem');
const axios = require('axios');

class StpProvider {

    constructor() {

    }

    getSignAltaOrden = async (ordenPagoWs) => {
        let cadenaOriginal = `||${ordenPagoWs['institucionContraparte']}|TIM2|||${ordenPagoWs['claveRastreo']}|${ordenPagoWs['institucionOperante']}|${(ordenPagoWs['monto']).toFixed(2)}|${ordenPagoWs['tipoPago']}|${ordenPagoWs['tipoCuentaOrdenante']}|${ordenPagoWs['nombreOrdenante']}|${ordenPagoWs['cuentaOrdenante']}|${ordenPagoWs['rfcCurpOrdenante']}|${ordenPagoWs['tipoCuentaBeneficiario']}|${ordenPagoWs['nombreBeneficiario']}|${ordenPagoWs['cuentaBeneficiario']}|${ordenPagoWs['rfcCurpBeneficiario']}||||||${ordenPagoWs['conceptoPago']}||||||${ordenPagoWs['referenciaNumerica']}||||||||`;
        console.log("cadenaOriginal: ",cadenaOriginal);
        var sign = crypto.createSign('RSA-SHA256');
        sign.update(cadenaOriginal);
        sign.end();

        const key = fs.readFileSync(filePath);
        let signature_b64 = sign.sign(key, 'base64');
        return signature_b64;
    }

    getcadenaConciliacion= async (tipo) => {
        let cadenaOriginal = `||TIM2|${tipo}|||`;
        console.log("cadenaOriginal: ",cadenaOriginal);
        var sign = crypto.createSign('RSA-SHA256');
        sign.update(cadenaOriginal);
        sign.end();
        const key = fs.readFileSync(filePath);
        let signature_b64 = sign.sign(key, 'base64');
        return signature_b64;
    }

    getcadenaConsultaSaldo = async (cuenta) => {
        let cadenaOriginal = `||TIM2|${cuenta}|||`;
        console.log("cadenaOriginal: ",cadenaOriginal);
        var sign = crypto.createSign('RSA-SHA256');
        sign.update(cadenaOriginal);
        sign.end();
        const key = fs.readFileSync(filePath);
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
        const key = fs.readFileSync(filePath);
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

  getSaldoCuenta = async (bodydata) => {

            
    let config = {
      method: 'post',
      url: 'https://efws-dev.stpmex.com/efws/API/consultaSaldoCuenta',
      headers: { 
        'Content-Type': 'application/json'
      },
      data : JSON.stringify(bodydata)
    };
    
  const result = await axios.request(config);
  return result.data;
}

    getConciliacion = async (bodydata) => {

                
        let config = {
        method: 'post',
        url: 'https://efws-dev.stpmex.com/efws/API/V2/conciliacion',
        headers: { 
            'Content-Type': 'application/json'
        },
        data : JSON.stringify(bodydata)
        };
        let result = {data:""};
        await axios.request(config).then((r) => {result = r.data}).catch(e => {result = e.response.data});
        return result;
    }
  
    
  

}

export default StpProvider;
