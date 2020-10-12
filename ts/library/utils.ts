const config = require('../../config.json');
const results = require('../../results.json');
const sd = require('silly-datetime');
import got from 'got';
import uuidv1 from 'uuid/v1';
import uuidv4 from 'uuid/v4';
const md5 = require('md5');
import fs from "fs";
import path from "path";

export module utils {
    export async function getAsync(url:string, retry?:number){
        try {
            let options:any = {
                timeout:10*100
            };
            if(retry != undefined || retry != 0){
                options.retries = retry;
            }
            let res:any = await got.get(url,options);
            let response = {
                code:res.statusCode,
                body:res.body,
                url:res.requestUrl,
                path:res.req.path,
                header:res.req._header
            };
            return response;
        } catch (error) {
            let response = {
                code:error.statusCode,
                body:error.response.body,
                url:error.url,
                path:error.path,
                header:error.headers
            };
            return response;
        }
    }
    export async function postAsyncByPayLoad(url: string, data: any) {
        try {
            let options:any = {
                timeout:10*100,
                body:data
            };
            let res:any = await got.post(url,options);
            let response = {
                code:res.statusCode,
                body:res.body,
                url:res.requestUrl,
                path:res.req.path,
                header:res.req._header
            };
            return response;
        } catch (error) {
            let response = {
                code:error.statusCode,
                body:error.response.body,
                url:error.url,
                path:error.path,
                header:error.headers
            };
            return response;
        }
    }
    export async function postAsync(url: string, data: any, retry?:number) {
        try {
            let options:any = {
                timeout:10*100,
                query:data
            };
            if(retry != undefined || retry != 0){
                options.retries = retry;
            }
            let res:any = await got.post(url,options);
            let response = {
                code:res.statusCode,
                body:res.body,
                url:res.requestUrl,
                path:res.req.path,
                header:res.req._header
            };
            return response;
        } catch (error) {
            let response = {
                code:error.statusCode,
                body:error.response.body,
                url:error.url,
                path:error.path,
                header:error.headers
            };
            return response;
        }
    }
    
    export function date(format:string="YYYY-MM-DD HH:mm:ss"){
        return sd.format(new Date(), format);
    }

    //v1 是基于时间戳生成uuid
    //v4是随机生成uuid
    export function guid(clear = 1){
        let guid = uuidv1();
        if(clear == 1){
            return guid.replace(/-/g, '');
        }else{
            return guid;
        }
    }
    export function guidv4(clear = 1){
        let guid = uuidv4();
        if(clear == 1){
            return guid.replace(/-/g, '');
        }else{
            return guid;
        }
    }
    export function guidTuidMD5(clear = 1){
        let uuid = guidv4(2);
        let time = new Date().getTime();
        let guid = md5(`${uuid}${time}`);
        if(clear == 1){
            return guid;
        }else{
            return `${guid.substr(0,8)}-${guid.substr(8,4)}-${guid.substr(12,4)}-${guid.substr(16,4)}-${guid.substr(20,12)}`;
        }
    }

    export function empty(obj:any){
        if(obj == ''){
            return true;
        }
        if(obj == null){
            return true;
        }
        if(obj == undefined){
            return true;
        }
        if(typeof obj == 'object'){
            let len = Object.keys(obj).length;
            if(len > 0){
                return false;
            }
            len = obj.size;
            if(len == undefined || len == 0){
                return true;
            }
        }
        return false;
    }

    export function strDateTimeShort(str:string){
        var r:any = str.match(/^(\d{1,4})(-|\/)(\d{1,2})\2(\d{1,2})$/); 
        if(r==null)return false; 
        var d= new Date(r[1], r[3]-1, r[4]); 
        return (d.getFullYear()==r[1]&&(d.getMonth()+1)==r[3]&&d.getDate()==r[4]);
    }
 
    export function strDateTimeLong(str:string){
        var r:any = str.match(/^(\d{1,4})(-|\/)(\d{1,2})\2(\d{1,2}) (\d{1,2}):(\d{1,2}):(\d{1,2})$/); 
        if(r==null)return false; 
        var d = new Date(r[1], r[3]-1,r[4],r[5],r[6],r[7]); 
        return (d.getFullYear()==r[1]&&(d.getMonth()+1)==r[3]&&d.getDate()==r[4]&&d.getHours()==r[5]&&d.getMinutes()==r[6]&&d.getSeconds()==r[7]);
    }

    /***********************签名START************************ */
    export function CheckSign(secret:string, obj:object, reqSign:string){
        let sign = MakeSign(secret, obj);
        if(reqSign == sign){
            return true;
        }
        return false;
    }

    export function genSign(secret:string, obj:any){
        let sign = MakeSign(secret, obj);
        obj.sign = sign;
        return sign;
    }

    export function getNonceStr(length:number = 32){
        let chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
        let str = '';
        for(let i = 0; i < length; i++){
            str += chars[random(0, length)];
        }
        return str;
    }

    function ToUrlParams(obj:any){
        let buff = '';
        let key_obj = Object.keys(obj);
        key_obj = key_obj.sort();
        let len = key_obj.length;
        for(let i = 0; i < len; i++){
            if(key_obj[i] != 'sign' && !empty(obj[key_obj[i]])){
                buff += `${key_obj[i]}=${obj[key_obj[i]]}&`;
            }
        }
        return buff.substring(0, buff.length-1);
    }

    function MakeSign(key:string, obj:object){
        //签名步骤一：按字典序排序参数
        let string =ToUrlParams(obj);
        //签名步骤二：在string后加入KEY
        string += `&key=${key}`;
        //签名步骤三：MD5加密
        string = md5(string);
        //签名步骤四：所有字符转为大写
        let result = string.toLocaleUpperCase();
        return result;
    }
    /***********************签名END************************ */
    export function responseCommon(results:any, data:any, append?:any){
        if(results.data != undefined){
            delete results.data;
        }
        let code = results.code;
        let msg = results.message;
        if(results.data != undefined){
            data = results.data;
        }
        let response:any = {
            code : code,
            msg : msg,
            data : data
        };
        // if(!empty(append)){
        //     response.append = append;
        // }
        return response;
    }
    export function microtime(){
        return new Date().getTime()/1000;
    }
    export function tomest(date?:string){
        let tmp = 0;
        if(date == undefined){
            tmp = Math.round(new Date().getTime()/1000);
        }else{
            tmp = Math.round(new Date(date).getTime()/1000);
        }
        return tmp;
    }
    /**
     * 返回值内容处理
     * @param obj 
     * @param append 
     * @param type  1插头部 2插尾巴 3全替换
     */
    export function resultsHandle(resultStr:string, append?:string, type?:number, data?:any){
        let obj = results[resultStr];
        if(!empty(data)){
            obj.data = data;
        }
        if(append == undefined || type == undefined){
            return JSON.stringify(obj);
        }else{
            if(type == 1){
                obj.message = append+obj.message;
            }else if(type == 2){
                obj.message = obj.message+append;
            }else{
                obj.message = append;
            }
            return JSON.stringify(obj);
        }
    }

    export function random(min:number, max:number) {
        return Math.floor(Math.random() * (max - min)) + min;
    }
    // 递归创建目录 同步方法
    export function mkdirsSync(dirname:string) {
        if (fs.existsSync(dirname)) {
            return true;
        } else {
            if (mkdirsSync(path.dirname(dirname))) {
                fs.mkdirSync(dirname);
                return true;
            }
        }
    }
    export function in_array(search:string,array:any){
        for(var i in array){
            if(array[i]==search){
                return true;
            }
        }
        return false;
    }
    export function coin_format(num:number){
        if(num < 0){
            return 0;
        }
        return parseFloat((num-0.00000000005).toFixed(10));
    }

    export async function commonRequest(url:string,params:any,method:string='get'){
        try{
            let res:any;
            if(method == 'get'){
                res = await getAsync(`${url}${params}`);
            }else{
                res = await postAsync(url, params);
            }
            if(res.code == 200){
                if(!empty(res.body)){
                    return res.body;
                }
            }
            return null;
        }catch(e){
            return null;
        }
    }

    export function timeInteger(time:string){
        let ary = time.split(':');
        let hour = parseInt(ary[0]);
        let hourTemp = '00';
        let minTemp = '00';
        let midVal = 0;
        let min = parseInt(ary[1]);
        if(min >= 45 || min <= 15){
            minTemp = '00';
            if(min >= 45){
                midVal = 1;
            }
        }else{
            minTemp = '30';
        }
        hour += midVal;
        if(hour < 10){
            hourTemp = `0${hour}`;
        }else{
            if(hour == 24){
                hourTemp = '00';
            }else{
                hourTemp = `${hour}`;
            }
        }
        return `${hourTemp}:${minTemp}`;
    }

    export function unique5(arr:any){
        var x = new Set(arr);
        return [...x];
    }
    export function usernameRegularValidate(content:string, resultKey:string,msg:string, range:any){
        if(!empty(range)){
            let len = content.length;
            if(range.min > len || range.max < len){
                throw new Error(resultsHandle(resultKey, msg, 3));
            }
        }
        let patt1 = /^[\u4E00-\u9FA5A-Za-z0-9_]+$/u;
        let flag = patt1.test(content);
        if(!flag){
            throw new Error(resultsHandle(resultKey, msg, 3));
        }
    }
    export function blurEmail(email:string){
        let len = email.length;
        let w = email.indexOf('@');
        if(w > 4){
            let start = w-3;
            let startStr = '*'.repeat(start);
            return email.substring(0,3)+startStr+email.substring(w);
        }else{
            let start = Math.round(w/2);
            let startStr = '*'.repeat(start);
            return email.substring(0,(w-start))+startStr+email.substring(w);
        }
    }
}