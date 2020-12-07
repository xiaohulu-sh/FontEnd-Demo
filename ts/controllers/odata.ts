import { date, required } from '@hapi/joi';
import { platform } from 'os';
import { redisHelper } from '../library/redisHelper';
import { utils } from '../library/utils';
const config = require('../../config.json');
const results = require('../../results.json');
const sd = require('silly-datetime');
const md5 = require('md5');
import { constants } from '../library/constants';

export module odata{
    export async function odata_tag_list(request:any, microtime:number){
        let query = null;
        let method = request.method;
        let route = request.path;
        let paramsCode = '';
        let response:any = {
            list:[]
        };
        try{
            if(method == 'get'){
                query = request.query;
            }else if(method == 'post'){
                query = request.payload;
            }
            let page = query.page;
            let limit = query.limit;
            paramsCode = md5(`${route}|${page}|${limit}`);
            
            let cacheRes:any = await redisHelper.get(`${redisHelper.P_DATA_POOL}${paramsCode}`);
            if(!utils.empty(cacheRes)){
                return utils.responseCommon(results['SUCCESS'], JSON.parse(cacheRes), {
                    microtime:microtime,
                    path:route,
                    resTime:utils.microtime()
                });
            }
            let res:any = await utils.getAsyncRequest(`${config['core_host']}/odata/mvanchortags`,{
                '$filter':`Lv eq 1`
            },{
                'app-id':config['core_appid'],
                'app-secret':config['core_appsecret']
            });

            let ret = JSON.parse(res);
            if(ret.code == undefined){
                let data = ret.value;
                response.list = data;
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
    export async function odata_filter_tags(request:any, microtime:number){
        let query = null;
        let method = request.method;
        let route = request.path;
        let paramsCode = '';
        let response:any = {
            list:[]
        };
        try{
            if(method == 'get'){
                query = request.query;
            }else if(method == 'post'){
                query = request.payload;
            }
            let tagIds = query.tagIds;
            paramsCode = md5(`${route}|${tagIds}`);
            
            let cacheRes:any = await redisHelper.get(`${redisHelper.P_DATA_POOL}${paramsCode}`);
            if(!utils.empty(cacheRes)){
                return utils.responseCommon(results['SUCCESS'], JSON.parse(cacheRes), {
                    microtime:microtime,
                    path:route,
                    resTime:utils.microtime()
                });
            }
            let res:any = await utils.getAsyncRequest(`${config['core_host']}/odata/anchortagstrings`,{
                '$filter':`id in (${tagIds})`,
                '$select':'Id,TagNames'
            },{
                'app-id':config['core_appid'],
                'app-secret':config['core_appsecret']
            });

            let ret = JSON.parse(res);
            if(ret.code == undefined){
                let data = ret.value;
                response.list = data;
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