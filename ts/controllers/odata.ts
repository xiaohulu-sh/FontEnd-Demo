import { date, required } from '@hapi/joi';
import { platform } from 'os';
import { redisHelper } from '../library/redisHelper';
import { utils } from '../library/utils';
const config = require('../../config.json');
const results = require('../../results.json');
const sd = require('silly-datetime');
const md5 = require('md5');
import { constants } from '../library/constants';
import { emit } from 'process';
import { constant } from 'async';

export module odata{
    /**
     * 批量获取红人信息
     * @param request 
     * @param microtime 
     */
    export async function odata_get_anchor_info_batch(request:any, microtime:number){
        let query = null;
        let method = request.method;
        let route = request.path;
        let paramsCode = '';
        let response:any = {};
        try{
            if(method == 'get'){
                query = request.query;
            }else if(method == 'post'){
                query = request.payload;
            }
            let batch_pid_rid = query.batch_pid_rid;
            paramsCode = md5(`${route}|${batch_pid_rid}`);

            let cacheRes:any = await redisHelper.get(`${redisHelper.P_DATA_POOL}${paramsCode}`);
            if(!utils.empty(cacheRes)){
                return utils.responseCommon(results['SUCCESS'], JSON.parse(cacheRes), {
                    microtime:microtime,
                    path:route,
                    resTime:utils.microtime()
                });
            }
            let ary = batch_pid_rid.split('|');
            let filterAry = [];
            for(let i = 0; i < ary.length; i++){
                let pid_rid = ary[i].split(',');
                response[ary[i]] = {};
                filterAry.push(`(platformid eq ${pid_rid[0]} and roomid eq '${pid_rid[1]}')`);
            }
            let paramsVal = filterAry.join(' or ');
            let res:any = await utils.getAsyncRequest(`${config['core_host']}/odata/MvJdAnchors`,{
                '$filter':paramsVal
            },{
                'app-id':'a4a8f83e-3aec-4e71-9e79-533245bb3638',
                'app-secret':'49608416-4cd6-48fa-aac7-51e77e80ce8a'
            })
            let ret = JSON.parse(res);
            if(ret.code == undefined){
                let data = ret.value;
                for(let i = 0 ; i < data.length; i++){
                    if(response[`${data[i].PlatformId},${data[i].RoomId}`] != undefined){
                        response[`${data[i].PlatformId},${data[i].RoomId}`] = data[i];
                    }
                }
            }
            await redisHelper.setex(`${redisHelper.P_DATA_POOL}${paramsCode}`, redisHelper._expire_t, JSON.stringify(response));
            return utils.responseCommon(results['SUCCESS'], response, {
                microtime:microtime,
                path:route,
                resTime:utils.microtime()
            });
        }catch(e){
            await redisHelper.setex(`${redisHelper.P_DATA_POOL}${paramsCode}`, redisHelper._expire_short_t, JSON.stringify(response));
            try{
                let data = JSON.parse(e.message);
                return utils.responseCommon(data, null, {
                    microtime:microtime,
                    path:route,
                    resTime:utils.microtime()
                });
            }catch(error){
                console.log(`[crash][${sd.format(new Date(), 'YYYY-MM-DD HH:mm:ss')}] ${route}|${JSON.stringify(query)}`);
                return utils.responseCommon(results['ERROR'], null, {});
            }
        }
    }
    
    export async function odata_get_tag(request:any, microtime:number){
        let query = null;
        let method = request.method;
        let route = request.path;
        let paramsCode = '';
        let response:any = {};
        try{
            if(method == 'get'){
                query = request.query;
            }else if(method == 'post'){
                query = request.payload;
            }
            let tags = query.tags;
            paramsCode = md5(`${route}|${tags}`);

            let cacheRes:any = await redisHelper.get(`${redisHelper.P_DATA_POOL}${paramsCode}`);
            if(!utils.empty(cacheRes)){
                return utils.responseCommon(results['SUCCESS'], JSON.parse(cacheRes), {
                    microtime:microtime,
                    path:route,
                    resTime:utils.microtime()
                });
            }
            let ary = tags.split(',');
            let filterAry = [];
            for(let i = 0; i < ary.length; i++){
                filterAry.push(`(id eq ${ary[i]})`);
            }
            let paramsVal = `(${filterAry.join(' or ')}) and Lv eq 1`;
            let res:any = await utils.getAsyncRequest(`${config['core_host']}/odata/anchortags`,{
                '$filter':paramsVal
            },{
                'app-id':'a4a8f83e-3aec-4e71-9e79-533245bb3638',
                'app-secret':'49608416-4cd6-48fa-aac7-51e77e80ce8a'
            })
            let ret = JSON.parse(res);
            if(ret.code == undefined){
                let data = ret.value;
                for(let i = 0 ; i < data.length; i++){
                    response[data[i].Id] = data[i].TagName;
                }
            }
            await redisHelper.setex(`${redisHelper.P_DATA_POOL}${paramsCode}`, redisHelper._expire_t, JSON.stringify(response));
            return utils.responseCommon(results['SUCCESS'], response, {
                microtime:microtime,
                path:route,
                resTime:utils.microtime()
            });
        }catch(e){
            await redisHelper.setex(`${redisHelper.P_DATA_POOL}${paramsCode}`, redisHelper._expire_short_t, JSON.stringify(response));
            try{
                let data = JSON.parse(e.message);
                return utils.responseCommon(data, null, {
                    microtime:microtime,
                    path:route,
                    resTime:utils.microtime()
                });
            }catch(error){
                console.log(`[crash][${sd.format(new Date(), 'YYYY-MM-DD HH:mm:ss')}] ${route}|${JSON.stringify(query)}`);
                return utils.responseCommon(results['ERROR'], null, {});
            }
        }
    }
}