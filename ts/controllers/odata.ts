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
                'app-id':config['core_appid'],
                'app-secret':config['core_appsecret']
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
            let paramsVal = `id in (${ary.join(',')}) and Lv eq 1`;
            let res:any = await utils.getAsyncRequest(`${config['core_host']}/odata/anchortags`,{
                '$filter':paramsVal
            },{
                'app-id':config['core_appid'],
                'app-secret':config['core_appsecret']
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
    
    export async function odata_get_tag_classify(request:any, microtime:number){
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
            paramsCode = md5(`${route}`);

            let cacheRes:any = await redisHelper.get(`${redisHelper.P_DATA_POOL}${paramsCode}`);
            if(!utils.empty(cacheRes)){
                return utils.responseCommon(results['SUCCESS'], JSON.parse(cacheRes), {
                    microtime:microtime,
                    path:route,
                    resTime:utils.microtime()
                });
            }
            let res:any = await utils.getAsyncRequest(`${config['core_host']}/odata/anchortags`,{
                '$filter':`Lv eq 1`
            },{
                'app-id':config['core_appid'],
                'app-secret':config['core_appsecret']
            });
            let ret = JSON.parse(res);
            if(ret.code == undefined){
                let data = ret.value;
                let list:any = [];
                for(let i = 0 ; i < data.length; i++){
                    list.push({
                        id:data[i].Id,
                        name:data[i].TagName
                    });
                }
                response.list = list;
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
    export async function odata_anchor_list_by_type(request:any, microtime:number){
        let query = null;
        let method = request.method;
        let route = request.path;
        let paramsCode = '';
        let response:any = {
            total:0,
            list:[],
            current_page:1,
            last_page:1
        };
        try{
            if(method == 'get'){
                query = request.query;
            }else if(method == 'post'){
                query = request.payload;
            }
            let plat_type = query.plat_type;
            let cate_type = query.cate_type;
            let province = query.province;
            let region = query.region;
            let gender = query.gender;
            let fans_age = query.fans_age;
            let fansnum = query.fansnum;
            let page = query.page;
            let limit = query.limit;
            if(page <= 0){
                page = 1;
            }
            if(limit > 30){
                limit = 30;
            }
            if(limit <= 0){
                limit = 30;
            }
            paramsCode = md5(`${route}|${plat_type}|${cate_type}|${province}|${region}|${gender}|${fans_age}|${fansnum}|${page}|${limit}`);

            let cacheRes:any = await redisHelper.get(`${redisHelper.P_DATA_POOL}${paramsCode}`);
            if(!utils.empty(cacheRes)){
                return utils.responseCommon(results['SUCCESS'], JSON.parse(cacheRes), {
                    microtime:microtime,
                    path:route,
                    resTime:utils.microtime()
                });
            }

            if(!utils.empty(plat_type)){
                if(plat_type == constants.VIDEO_DOUYIN_PLAT_ID){
                    plat_type = constants.DOUYIN_EXTEND_PLAT_ID;
                }else if(plat_type == constants.VIDEO_KUAISHOU_PLAT_ID){
                    plat_type = constants.KUAISHOU_EXTEND_PLAT_ID;
                }
            }
            let filter = ``;
            let is_add_add = false;
            if(!utils.empty(plat_type)){
                filter += `platform eq ${plat_type}`;
                is_add_add = true;
            }
            if(!utils.empty(cate_type)){
                if(is_add_add){
                    filter += ` and `;
                }
                filter += `contains(tagbyh,'${cate_type}')`;
                is_add_add = true;
            }
            if(!utils.empty(province) && !utils.empty(region)){
                if(is_add_add){
                    filter += ` and `;
                }
                filter += `contains(locationname,'${encodeURIComponent(`${province},${region}`)}')`;
                is_add_add = true;
            }else if(!utils.empty(province)){
                if(is_add_add){
                    filter += ` and `;
                }
                filter += `contains(locationname,'${encodeURIComponent(`${province}`)}')`;
                is_add_add = true;
            }
            if(!utils.empty(gender)){
                if(is_add_add){
                    filter += ` and `;
                }
                filter += `gender eq ${gender}`;
                is_add_add = true;
            }
            if(!utils.empty(fans_age)){
                if(is_add_add){
                    filter += ` and `;
                }
                //1.18岁以下 2.18-25 3.26-32 4.33-39 5.40以上
                let ary = fans_age.split(',');
                let chooseList:any = [];
                for(let i = 0; i < ary.length; i++){
                    switch(ary[i]){
                        case '1':
                            chooseList.push(`FanAnalysisAge18 gt 0`);
                            break;
                        case '2':
                            chooseList.push(`FanAnalysisAge1825 gt 0`);
                            break;
                        case '3':
                            chooseList.push(`FanAnalysisAge2632 gt 0`);
                            break;
                        case '4':
                            chooseList.push(`FanAnalysisAge3339 gt 0`);
                            break;
                        case '5':
                            chooseList.push(`FanAnalysisAge40 gt 0`);
                            break;
                    }
                }
                filter += chooseList.join(' and ');
                is_add_add = true;
            }
            if(!utils.empty(fansnum)){
                if(is_add_add){
                    filter += ` and `;
                }
                let ary = fansnum.split('-');
                let headVal = parseInt(ary[0]);
                let tailVal = parseInt(ary[1]);
                if(tailVal == 0){//单个大于
                    filter += `(((FanBoyCount add FanGirlCount) ge ${headVal}) or (FansNum ge ${headVal}))`;
                }else if(headVal == 0){//单个小于
                    filter += `(((FanBoyCount add FanGirlCount) le ${tailVal}) or (FansNum ge ${tailVal}))`;
                }else{
                    if(headVal > tailVal){
                        filter += `((((FanBoyCount add FanGirlCount) ge ${tailVal}) and ((FanBoyCount add FanGirlCount) le ${headVal})) or ((FansNum ge ${tailVal}) and (FansNum le ${headVal})))`;
                    }else{
                        filter += `((((FanBoyCount add FanGirlCount) ge ${headVal}) and ((FanBoyCount add FanGirlCount) le ${tailVal})) or ((FansNum ge ${headVal}) and (FansNum le ${tailVal})))`;
                    }
                }
                is_add_add = true;
            }
            
            let res:any = await utils.getAsyncRequest(`${config['core_host']}/odata/mvjdanchors`,{
                '$filter':filter,
                '$count':true,
                '$skip':page*limit-limit,
                '$top':limit,
                '$orderby':'FansNum desc'
            },{
                'app-id':config['core_appid'],
                'app-secret':config['core_appsecret']
            });
            let ret = JSON.parse(res);
            let total = ret['@odata.count'];
            response.total = total;
            response.current_page = page;
            let lastpage = Math.ceil(total/limit);
            response.last_page = lastpage;
            if(!utils.empty(ret.value)){
                let data = ret.value;
                let len = data.length;
                let list:any = [];
                let tags:any = [];
                let batch_pid_rid:any = [];
                for(let i = 0 ; i < len; i++){
                    let tagsTemp = [];
                    if(!utils.empty(data[i].TagByH)){
                        tagsTemp = data[i].TagByH.split(',');
                        tags = tags.concat(tagsTemp);
                    }
                    batch_pid_rid.push(`${data[i].Platform==301?201:202},${data[i].RoomId}`);
                    list.push({
                        guildname:'',
                        tags:[],
                        tagIds:tagsTemp,
                        pid:data[i].Platform==301?201:202,
                        rid:data[i].RoomId,
                        nickname:utils.defaultVal(data[i].Nickname, data[i].Nickname, utils.defaultVal(data[i].Nickname2, data[i].Nickname2,'')),
                        LocationName:utils.defaultVal(data[i].LocationName, data[i].LocationName, utils.defaultVal(data[i].LocationName2, data[i].LocationName2,'')),
                        gender:utils.defaultVal(data[i].Gender, data[i].Gender, 0),
                        fansnum:utils.defaultVal(data[i].FansNum, data[i].FansNum, utils.defaultVal(data[i].FanBoyCount+data[i].FanGirlCount,data[i].FanBoyCount+data[i].FanGirlCount,0)),
                        diggnum:utils.defaultVal(data[i].TotalDigg, data[i].TotalDigg, utils.defaultVal(data[i].TotalDiggCount,data[i].TotalDiggCount,0)),
                        price_1_20s:utils.defaultVal(data[i].XtPrice1, data[i].XtPrice1, 0),
                        price_21_60s:utils.defaultVal(data[i].XtPrice2, data[i].XtPrice2, 0),
                        videonum:utils.defaultVal(data[i].VideoNum, data[i].VideoNum, 0),
                        new_fans_30:utils.defaultVal(data[i].NewFans30, data[i].NewFans30, 0),
                        avatar:utils.defaultVal(data[i].Avatar, data[i].Avatar, utils.defaultVal(data[i].Avatar2, data[i].Avatar2, `https://xhlcdn.xiaohulu.com/avatar/${data[i].PlatformId2}/${data[i].RoomId}`)),
                        fans_boy_count:utils.defaultVal(data[i].FanBoyCount, data[i].FanBoyCount, 0),
                        fans_girl_count:utils.defaultVal(data[i].FanGirlCount, data[i].FanGirlCount, 0),
                        fans_age_18:utils.defaultVal(data[i].FanAnalysisAge18, data[i].FanAnalysisAge18, 0),
                        fans_age_18_25:utils.defaultVal(data[i].FanAnalysisAge1825, data[i].FanAnalysisAge1825, 0),
                        fans_age_26_32:utils.defaultVal(data[i].FanAnalysisAge2632, data[i].FanAnalysisAge2632, 0),
                        fans_age_33_39:utils.defaultVal(data[i].FanAnalysisAge3339, data[i].FanAnalysisAge3339, 0),
                        fans_age_40:utils.defaultVal(data[i].FanAnalysisAge40, data[i].FanAnalysisAge40, 0),
                    });
                }
                let guildRes:any = await utils.getAsyncRequest(`${config['core_host']}/apis/core-data/api/v1/coreguildByAnchor`,{
                    batch_pid_rid:batch_pid_rid.join('|')
                },{
                    'app-id':config['core_appid'],
                    'app-secret':config['core_appsecret']
                })
                let guildRet = JSON.parse(guildRes);
                let guildMap:any = {};
                if(guildRet.status == 200 && !utils.empty(guildRet.data)){
                    guildMap = guildRet.data;
                }
                tags = utils.unique5(tags);
                let tagMap:any = {};
                if(!utils.empty(tags)){
                    let paramsVal = `id in (${tags.join(',')}) and Lv eq 1`;
                    let tagListRes:any = await utils.getAsyncRequest(`${config['core_host']}/odata/anchortags`,{
                        '$filter':paramsVal
                    },{
                        'app-id':config['core_appid'],
                        'app-secret':config['core_appsecret']
                    })
                    let tagListRet = JSON.parse(tagListRes);
                    if(tagListRet.code == undefined){
                        let tagListData = tagListRet.value;
                        for(let i = 0 ; i < tagListData.length; i++){
                            tagMap[tagListData[i].Id] = tagListData[i].TagName;
                        }
                    }
                }
                for(let o of Object.keys(list)){
                    let tagIdList = list[o].tagIds;
                    for(let p of Object.keys(tagMap)){
                        if(utils.in_array(p, tagIdList)){
                            list[o].tags.push(tagMap[p]);
                        }
                    }
                    for(let g of Object.keys(guildMap)){
                        list[o].guildname = utils.defaultVal(guildMap[`${list[o].pid},${list[o].rid}`], guildMap[`${list[o].pid},${list[o].rid}`], '');
                    }
                }
                response.list = list;
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
    export async function odata_anchor_list_by_batch(request:any, microtime:number){
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
                let platform = 0;
                if(pid_rid[0] == constants.VIDEO_DOUYIN_PLAT_ID){
                    platform = constants.DOUYIN_EXTEND_PLAT_ID;
                }else if(pid_rid[0] == constants.VIDEO_KUAISHOU_PLAT_ID){
                    platform = constants.KUAISHOU_EXTEND_PLAT_ID;
                }
                if(platform != 0){
                    filterAry.push(`(platform eq ${platform} and roomid eq '${pid_rid[1]}')`);
                }
            }
            let paramsVal = filterAry.join(' or ');
            let res:any = await utils.getAsyncRequest(`${config['core_host']}/odata/MvJdAnchors`,{
                '$filter':paramsVal
            },{
                'app-id':config['core_appid'],
                'app-secret':config['core_appsecret']
            })
            let ret = JSON.parse(res);
            if(!utils.empty(ret.value)){
                let data = ret.value;
                let len = data.length;
                let tags:any = [];
                let batch_pid_rid:any = [];
                for(let i = 0 ; i < len; i++){
                    let tagsTemp = [];
                    if(!utils.empty(data[i].TagByH)){
                        tagsTemp = data[i].TagByH.split(',');
                        tags = tags.concat(tagsTemp);
                    }
                    batch_pid_rid.push(`${data[i].Platform==301?201:202},${data[i].RoomId}`);
                    response[`${data[i].Platform==301?201:202},${data[i].RoomId}`]={
                        guildname:'',
                        tags:[],
                        tagIds:tagsTemp,
                        pid:data[i].Platform==301?201:202,
                        rid:data[i].RoomId,
                        nickname:utils.defaultVal(data[i].Nickname, data[i].Nickname, utils.defaultVal(data[i].Nickname2, data[i].Nickname2,'')),
                        LocationName:utils.defaultVal(data[i].LocationName, data[i].LocationName, utils.defaultVal(data[i].LocationName2, data[i].LocationName2,'')),
                        gender:utils.defaultVal(data[i].Gender, data[i].Gender, 0),
                        fansnum:utils.defaultVal(data[i].FansNum, data[i].FansNum, utils.defaultVal(data[i].FanBoyCount+data[i].FanGirlCount,data[i].FanBoyCount+data[i].FanGirlCount,0)),
                        diggnum:utils.defaultVal(data[i].TotalDigg, data[i].TotalDigg, utils.defaultVal(data[i].TotalDiggCount,data[i].TotalDiggCount,0)),
                        price_1_20s:utils.defaultVal(data[i].XtPrice1, data[i].XtPrice1, 0),
                        price_21_60s:utils.defaultVal(data[i].XtPrice2, data[i].XtPrice2, 0),
                        videonum:utils.defaultVal(data[i].VideoNum, data[i].VideoNum, 0),
                        new_fans_30:utils.defaultVal(data[i].NewFans30, data[i].NewFans30, 0),
                        avatar:utils.defaultVal(data[i].Avatar, data[i].Avatar, utils.defaultVal(data[i].Avatar2, data[i].Avatar2, `https://xhlcdn.xiaohulu.com/avatar/${data[i].PlatformId2}/${data[i].RoomId}`)),
                        fans_boy_count:utils.defaultVal(data[i].FanBoyCount, data[i].FanBoyCount, 0),
                        fans_girl_count:utils.defaultVal(data[i].FanGirlCount, data[i].FanGirlCount, 0),
                        fans_age_18:utils.defaultVal(data[i].FanAnalysisAge18, data[i].FanAnalysisAge18, 0),
                        fans_age_18_25:utils.defaultVal(data[i].FanAnalysisAge1825, data[i].FanAnalysisAge1825, 0),
                        fans_age_26_32:utils.defaultVal(data[i].FanAnalysisAge2632, data[i].FanAnalysisAge2632, 0),
                        fans_age_33_39:utils.defaultVal(data[i].FanAnalysisAge3339, data[i].FanAnalysisAge3339, 0),
                        fans_age_40:utils.defaultVal(data[i].FanAnalysisAge40, data[i].FanAnalysisAge40, 0),
                    };
                }
                let guildRes:any = await utils.getAsyncRequest(`${config['core_host']}/apis/core-data/api/v1/coreguildByAnchor`,{
                    batch_pid_rid:batch_pid_rid.join('|')
                },{
                    'app-id':config['core_appid'],
                    'app-secret':config['core_appsecret']
                })
                let guildRet = JSON.parse(guildRes);
                let guildMap:any = {};
                if(guildRet.status == 200 && !utils.empty(guildRet.data)){
                    guildMap = guildRet.data;
                }
                tags = utils.unique5(tags);
                let tagMap:any = {};
                if(!utils.empty(tags)){
                    let paramsVal = `id in (${tags.join(',')}) and Lv eq 1`;
                    let tagListRes:any = await utils.getAsyncRequest(`${config['core_host']}/odata/anchortags`,{
                        '$filter':paramsVal
                    },{
                        'app-id':config['core_appid'],
                        'app-secret':config['core_appsecret']
                    })
                    let tagListRet = JSON.parse(tagListRes);
                    if(tagListRet.code == undefined){
                        let tagListData = tagListRet.value;
                        for(let i = 0 ; i < tagListData.length; i++){
                            tagMap[tagListData[i].Id] = tagListData[i].TagName;
                        }
                    }
                }
                for(let o of Object.keys(response)){
                    let tagIdList = response[o].tagIds;
                    for(let p of Object.keys(tagMap)){
                        if(utils.in_array(p, tagIdList)){
                            response[o].tags.push(tagMap[p]);
                        }
                    }
                    for(let g of Object.keys(guildMap)){
                        response[o].guildname = utils.defaultVal(guildMap[`${response[o].pid},${response[o].rid}`], guildMap[`${response[o].pid},${response[o].rid}`], '');
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
    
    export async function odata_locationname_list(request:any, microtime:number){
        let query = null;
        let method = request.method;
        let route = request.path;
        let paramsCode = '';
        let response:any = {
            total:0,
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
            if(page <= 0){
                page = 1;
            }
            if(limit <= 0){
                limit = 10;
            }
            paramsCode = md5(`${route}|${page}|${limit}`);
            
            let cacheRes:any = await redisHelper.get(`${redisHelper.P_DATA_POOL}${paramsCode}`);
            if(!utils.empty(cacheRes)){
                return utils.responseCommon(results['SUCCESS'], JSON.parse(cacheRes), {
                    microtime:microtime,
                    path:route,
                    resTime:utils.microtime()
                });
            }
            let res:any = await utils.getAsyncRequest(`${config['core_host']}/odata/mvjdanchors`,{
                '$filter':`locationname ne null and locationname ne ''`,
                '$skip':page*limit-limit,
                '$count':true,
                '$top':limit,
                '$select':'LocationName'
            },{
                'app-id':config['core_appid'],
                'app-secret':config['core_appsecret']
            });

            let ret = JSON.parse(res);
            let total = ret['@odata.count'];
            response.total = total;
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