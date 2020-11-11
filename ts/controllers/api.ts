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

export module api{
    /**
     * 红人基础信息
     * @param request 
     * @param microtime 
     */
    export async function anchor_base_info(request:any, microtime:number){
        let query = null;
        let method = request.method;
        let route = request.path;
        let paramsCode = '';
        let response:any = {
            // live_basic_data:{},
            // video_basic_data:{}
        };
        try{
            if(method == 'get'){
                query = request.query;
            }else if(method == 'post'){
                query = request.payload;
            }
            let platform = query.platform;
            let roomid = query.roomid;
            paramsCode = md5(`${route}|${platform}|${roomid}`);
            // let isRefresh = query.isRefresh;

            // if(isRefresh == 2){
                let cacheRes:any = await redisHelper.get(`${redisHelper.P_DATA_POOL}${paramsCode}`);
                if(!utils.empty(cacheRes)){
                    return utils.responseCommon(results['SUCCESS'], JSON.parse(cacheRes), {
                        microtime:microtime,
                        path:route,
                        resTime:utils.microtime()
                    });
                }
            // }
            
            //短视频数据获取
            let video_res:any = await utils.postAsyncRequest(`${config['core_host']}/apis/cloud/api/v1/shortvideo/author/detail/get`, {
                platId:platform,
                roomId:roomid
            },{
                'Content-Type':'application/json'
            },"body");
            let video_ret = JSON.parse(video_res);
            if(video_ret.code == 0 && !utils.empty(video_ret.data)){
                let data = video_ret.data;
                if(!utils.empty(data)){
                    response = {
                        platform:platform,
                        roomid:roomid,
                        gender:data.gender,
                        fans_num:data.fans_num,
                        description:data.description,
                        user_id:data.user_id,
                        favorited_num:data.favorited_num,
                        nickname:data.nickname,
                        avatar:data.avatar,
                        location_name:data.location_name,
                        video_num:data.video_num,
                        tagName:data.tagName,
                        custom_verify:data.custom_verify
                    };
                }else{
                    await redisHelper.setex(`${redisHelper.P_DATA_POOL}${paramsCode}`, redisHelper._expire_middle_t, JSON.stringify(response));
                }
            }else{
                await redisHelper.setex(`${redisHelper.P_DATA_POOL}${paramsCode}`, redisHelper._expire_short_t, JSON.stringify(response));
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
    /**
     * 数据趋势表现
     * @param request 
     * @param microtime 
     */
    export async function video_data_summary(request:any, microtime:number){
        let query = null;
        let method = request.method;
        let route = request.path;
        let paramsCode = '';
        let response:any = {
            fans_num:0,
            video_num:0,
            favorited_num:0,
            avg_favorited_num:0,
            avg_comment_count:0,
            avg_share_count:0
        };
        try{
            if(method == 'get'){
                query = request.query;
            }else if(method == 'post'){
                query = request.payload;
            }
            let platform = query.platform;
            let roomid = query.roomid;
            paramsCode = md5(`${route}|${platform}|${roomid}`);

            let cacheRes:any = await redisHelper.get(`${redisHelper.P_DATA_POOL}${paramsCode}`);
            if(!utils.empty(cacheRes)){
                return utils.responseCommon(results['SUCCESS'], JSON.parse(cacheRes), {
                    microtime:microtime,
                    path:route,
                    resTime:utils.microtime()
                });
            }
            
            //短视频数据获取
            let video_res:any = await utils.postAsyncRequest(`${config['core_host']}/apis/cloud/api/v1/shortvideo/author/detail/get`, {
                platId:platform,
                roomId:roomid
            },{
                'Content-Type':'application/json'
            },"body");
            let video_ret = JSON.parse(video_res);
            if(video_ret.code == 0 && !utils.empty(video_ret.data)){
                let data = video_ret.data;
                if(!utils.empty(data)){
                    response.fans_num=data.fans_num;
                }
            }
            let overview_res:any = await utils.postAsyncRequest(`${config['core_host']}/apis/cloud/api/v1/shortvideo/author/overview/get`, {
                platId:platform,
                roomId:roomid
            },{
                'Content-Type':'application/json'
            },"body");
            let overview_ret = JSON.parse(overview_res);
            if(overview_ret.code == 0 && !utils.empty(overview_ret.data)){
                let data = overview_ret.data;
                if(!utils.empty(data)){
                    response.video_num = !utils.empty(data.whole_video_public_count)?data.whole_video_public_count:0;//总作品数
                    response.favorited_num = !utils.empty(data.whole_anchor_digg_count)?data.whole_anchor_digg_count:0;//总点赞数
                    let comment_count = !utils.empty(data.whole_video_comment_count)?data.whole_video_comment_count:0;//总评论数
                    let share_count = !utils.empty(data.whole_video_share_count)?data.whole_video_share_count:0;//总分享数
                    // response.thirty_day_new_fans_count = utils.empty(data.thirty_day_new_fans_count)?data.thirty_day_new_fans_count:0;//30天新增粉丝数

                    response.avg_favorited_num = (response.video_num>0)?(response.favorited_num/response.video_num).toFixed(1):'-';//平均点赞数
                    response.avg_comment_count = (response.video_num>0)?(comment_count/response.video_num).toFixed(1):'-';//平均评论数
                    response.avg_share_count = (response.video_num>0)?(share_count/response.video_num).toFixed(1):'-';//平均分享数
                }
            }
            // response.deadline = sd.format(+new Date()-24*60*60*1000, 'YYYY-MM-DD');

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
    /**
     * 数据趋势表现
     * @param request 
     * @param microtime 
     */
    export async function data_trend_line(request:any, microtime:number){
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
            let platform = query.platform;
            let roomid = query.roomid;
            let type = query.type;
            let day = query.day;
            paramsCode = md5(`${route}|${platform}|${roomid}|${type}|${day}`);

            let cacheRes:any = await redisHelper.get(`${redisHelper.P_DATA_POOL}${paramsCode}`);
            if(!utils.empty(cacheRes)){
                return utils.responseCommon(results['SUCCESS'], JSON.parse(cacheRes), {
                    microtime:microtime,
                    path:route,
                    resTime:utils.microtime()
                });
            }
            let list = [];
            let url = ''
            if(type == 1){
                url = `comment/trend/get`;
            }else if(type == 2){
                url = `fan/trend/get`;
            }else if(type == 3){
                url = `digg/trend/get`;
            }
            let trend_res:any = await utils.postAsyncRequest(`${config['core_host']}/apis/cloud/api/v1/shortvideo/author/${url}`, {
                platId:platform,
                roomId:roomid
            },{
                'Content-Type':'application/json'
            },"body");
            let trend_ret = JSON.parse(trend_res);
            if(trend_ret.code == 0 && !utils.empty(trend_ret.data)){
                let data:any = trend_ret.data;
                if(!utils.empty(data)){
                    if(day == 7){
                        list = data.slice(0,7);
                    }else{
                        list = data;
                    }
                }
            }
            response.list = list;
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
    /**
     * 作品发布频率
     * @param request 
     * @param microtime 
     */
    export async function video_issue_frequency(request:any, microtime:number){
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
            let platform = query.platform;
            let roomid = query.roomid;
            paramsCode = md5(`${route}|${platform}|${roomid}`);

            let cacheRes:any = await redisHelper.get(`${redisHelper.P_DATA_POOL}${paramsCode}`);
            if(!utils.empty(cacheRes)){
                return utils.responseCommon(results['SUCCESS'], JSON.parse(cacheRes), {
                    microtime:microtime,
                    path:route,
                    resTime:utils.microtime()
                });
            }
            let list:any = [];
            
            let res:any = await utils.getAsyncRequest(`${config['core_host']}/apis/bangdan/video_production_frequency`,{
                plat_id:platform,
                room_id:roomid
            });
            let ret = JSON.parse(res);
            if(ret.code == 100 && !utils.empty(ret.data)){
                let data:any = ret.data;
                if(!utils.empty(data)){
                    list = data;
                }
            }

            response.list = list;
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
    /**
     * 作品列表
     * @param request 
     * @param microtime 
     */
    export async function video_list(request:any, microtime:number){
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
            let platform = query.platform;
            let roomid = query.roomid;
            let type = query.type;
            let limit = query.limit;
            paramsCode = md5(`${route}|${platform}|${roomid}|${type}|${limit}`);

            let cacheRes:any = await redisHelper.get(`${redisHelper.P_DATA_POOL}${paramsCode}`);
            if(!utils.empty(cacheRes)){
                return utils.responseCommon(results['SUCCESS'], JSON.parse(cacheRes), {
                    microtime:microtime,
                    path:route,
                    resTime:utils.microtime()
                });
            }
            if(limit > 30){
                limit = 30;
            }
            if(limit <= 0){
                limit = 9;
            }
            let list:any = [];
            
            let url = '';
            if(type == 1){
                url = 'video/list/hot';
            }else if(type == 5){
                url = 'video/list/new';
            }
            let trend_res:any = await utils.postAsyncRequest(`${config['core_host']}/apis/cloud/api/v1/shortvideo/${url}`, {
                platId:platform,
                roomId:roomid
            },{
                'Content-Type':'application/json'
            },"body");
            let trend_ret = JSON.parse(trend_res);
            if(trend_ret.code == 0 && !utils.empty(trend_ret.data)){
                let data:any = trend_ret.data;
                if(!utils.empty(data)){
                    for(let i = 0; i < data.length; i++){
                        let video_screen_pic = '';
                        if(!utils.empty(data[i].video_screen_pic)){
                            video_screen_pic = data[i].video_screen_pic.replace(/bytecdn.cn/g,'byteimg.com');
                            video_screen_pic = data[i].video_screen_pic.replace(/p9-dy/g,'p1-dy');
                            video_screen_pic = data[i].video_screen_pic.replace(/p22-dy/g,'p1-dy');
                        }
                        list.push({
                            video_digg_count:data[i].video_digg_count,
                            video_share_count:data[i].video_share_count,
                            video_comment_count:data[i].video_comment_count,
                            video_view_count:!utils.empty(data[i].video_view_count)?data[i].video_view_count:0,
                            video_desc:data[i].video_desc,
                            video_url:data[i].video_share_url,
                            video_create_time:!utils.empty(data[i].video_create_time)?sd.format(data[i].video_create_time, 'YYYY-MM-DD'):'',
                            video_screen_pic:video_screen_pic
                        });
                    }
                }
            }

            response.list = list;
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
    /**
     * 送礼土豪列表
     * @param request 
     * @param microtime 
     */
    export async function tycoon_list(request:any, microtime:number){
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
            let platform = query.platform;
            let roomid = query.roomid;
            let time_type = query.time_type;
            let time = query.time;
            let page = query.page;
            let limit = query.limit;
            if(page <= 0){
                page = 1;
            }
            if(limit > 10){
                limit = 10;
            }
            if(limit <= 0){
                limit = 10;
            }
            paramsCode = md5(`${route}|${platform}|${roomid}|${time_type}|${time}|${page}|${limit}`);

            if(platform == constants.VIDEO_DOUYIN_PLAT_ID){
                platform = constants.LIVE_DOUYIN_PLAT_ID;
            }else if(platform == constants.VIDEO_KUAISHOU_PLAT_ID){
                platform = constants.LIVE_KUAISHOU_PLAT_ID;
            }

            let cacheRes:any = await redisHelper.get(`${redisHelper.P_DATA_POOL}${paramsCode}`);
            if(!utils.empty(cacheRes)){
                return utils.responseCommon(results['SUCCESS'], JSON.parse(cacheRes), {
                    microtime:microtime,
                    path:route,
                    resTime:utils.microtime()
                });
            }
            
            let list:any = [];
            let time_param = timeParamFormatTransform(time_type, time);
            if(time_type == constants.TIME_TYPE_RECENT_TIME && utils.in_array(time, [constants.TIME_TYPE_RECENT_7, constants.TIME_TYPE_RECENT_30])){
                let type = 7;
                if(time == constants.TIME_TYPE_RECENT_30){
                    type = 30;
                }
                let res:any = await utils.getAsyncRequest(`${config['server_url_ten']}/getVulgarGiftWeekAndMonthInfo`,{
                    plat_roomID_sets:`${platform},${roomid}`,
                    type:type,
                    date:sd.format(+new Date()-24*60*60*1000, 'YYYY-MM-DD'),
                    page:page,
                    msgCount:limit
                });
                let ret = JSON.parse(res);
                if(!utils.empty(ret)){
                    list = ret;
                }
            }else{
                let res:any = await utils.getAsyncRequest(`${config['server_url_ten']}/getVulgarGiftDailyStatisticsByDay`,{
                    platID:platform,
                    roomID:roomid,
                    startDate:time_param.current.start_time,
                    endDate:time_param.current.end_time,
                    page:page,
                    msgCount:limit,
                    sortType:2
                });
                let ret = JSON.parse(res);
                if(!utils.empty(ret)){
                    list = ret;
                }
            }
            list = await tycoon_list_detail(list);
            response.list = list;
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

    /**
     * 土豪列表详情获取
     * @param list 
     */
    async function tycoon_list_detail(list:any){
        try {
            let fansList = [];
            let fansMap:any = {};
            for(let i = 0; i < list.length; i++){
                fansList.push(`${list[i].platform_id},${list[i].from_id}`);
                fansMap[`${list[i].platform_id},${list[i].from_id}`] = i;
            }
            let fansListJoin = fansList.join('_');
            let res:any = await utils.getAsyncRequest(`${config['server_url_ten']}/getFansBaseInfoByPlatRoomIDSet`,{
                plat_fromID_sets:fansListJoin
            });
            let ret = JSON.parse(res);
            if(!utils.empty(ret)){
                for(let i = 0; i < ret.length; i++){
                    let plat_fromid = `${ret[i].platform_id},${ret[i].from_id}`;
                    list[fansMap[plat_fromid]].level = !utils.empty(ret[i].level)?ret[i].level:'';
                    list[fansMap[plat_fromid]].nickname = !utils.empty(ret[i].nickname)?ret[i].nickname:'';
                    list[fansMap[plat_fromid]].dyCoinOut = !utils.empty(list[fansMap[plat_fromid]].dyCoinOut)?list[fansMap[plat_fromid]].dyCoinOut/10:0;
                }
            }
        } catch (error) {
            console.log(error);
        }finally{
            return list;
        }
    }

    /**
     * 时间参数转换
     * @param timeType 
     * @param time 
     * @param incloude_today 
     * @param previous 
     */
    function timeParamFormatTransform(timeType:string, time:string, incloude_today:boolean=false, previous:boolean=true){
        let current_time:any = {};
        let previous_time:any = {};
        if(timeType == constants.TIME_TYPE_RECENT_TIME){
            switch(time){
                case constants.TIME_TYPE_YESTERDAY:
                    current_time = {
                        start_time:sd.format(+new Date()-24*60*60*1000, 'YYYY-MM-DD'),
                        end_time:sd.format(+new Date()-24*60*60*1000, 'YYYY-MM-DD'),
                    };
                    previous_time = {
                        start_time:sd.format(+new Date()-24*60*60*1000*2, 'YYYY-MM-DD'),
                        end_time:sd.format(+new Date()-24*60*60*1000*2, 'YYYY-MM-DD'),
                    };
                    break;
                case constants.TIME_TYPE_RECENT_7:
                    current_time = {
                        start_time:incloude_today?sd.format(+new Date()-24*60*60*1000*6, 'YYYY-MM-DD'):sd.format(+new Date()-24*60*60*1000*7, 'YYYY-MM-DD'),
                        end_time:incloude_today?sd.format(new Date(), 'YYYY-MM-DD'):sd.format(+new Date()-24*60*60*1000, 'YYYY-MM-DD'),
                    };
                    previous_time = {
                        start_time:sd.format(+new Date(current_time.start_time)-24*60*60*1000*7, 'YYYY-MM-DD'),
                        end_time:sd.format(+new Date(current_time.end_time)-24*60*60*1000*7, 'YYYY-MM-DD'),
                    };
                    break;
                case constants.TIME_TYPE_RECENT_15:
                    current_time = {
                        start_time:incloude_today?sd.format(+new Date()-24*60*60*1000*14, 'YYYY-MM-DD'):sd.format(+new Date()-24*60*60*1000*15, 'YYYY-MM-DD'),
                        end_time:incloude_today?sd.format(new Date(), 'YYYY-MM-DD'):sd.format(+new Date()-24*60*60*1000, 'YYYY-MM-DD'),
                    };
                    previous_time = {
                        start_time:sd.format(+new Date(current_time.start_time)-24*60*60*1000*15, 'YYYY-MM-DD'),
                        end_time:sd.format(+new Date(current_time.end_time)-24*60*60*1000*15, 'YYYY-MM-DD'),
                    };
                    break;
                case constants.TIME_TYPE_RECENT_30:
                    current_time = {
                        start_time:incloude_today?sd.format(+new Date(current_time.start_time)-24*60*60*1000*29, 'YYYY-MM-DD'):sd.format(+new Date()-24*60*60*1000*30, 'YYYY-MM-DD'),
                        end_time:incloude_today?sd.format(new Date(current_time.end_time), 'YYYY-MM-DD'):sd.format(+new Date()-24*60*60*1000, 'YYYY-MM-DD'),
                    };
                    previous_time = {
                        start_time:sd.format(+new Date()-24*60*60*1000*30, 'YYYY-MM-DD'),
                        end_time:sd.format(+new Date()-24*60*60*1000*30, 'YYYY-MM-DD'),
                    };
                    break;
                default:
                    current_time = {
                        start_time:sd.format(new Date(), 'YYYY-MM-DD'),
                        end_time:sd.format(new Date(), 'YYYY-MM-DD')
                    };
                    previous_time = {
                        start_time:sd.format(+new Date()-24*60*60*1000, 'YYYY-MM-DD'),
                        end_time:sd.format(+new Date()-24*60*60*1000, 'YYYY-MM-DD')
                    };
                    break;
            }
        }else{
            if(time == 'today'){
                current_time = {
                    start_time:sd.format(new Date(), 'YYYY-MM-DD'),
                    end_time:sd.format(new Date(), 'YYYY-MM-DD')
                };
            }else if(time == 'yesterday'){
                current_time = {
                    start_time:sd.format(+new Date()-24*60*60*1000, 'YYYY-MM-DD'),
                    end_time:sd.format(+new Date()-24*60*60*1000, 'YYYY-MM-DD')
                };
            }else{
                current_time = {
                    start_time:time,
                    end_time:time
                };
            }
            previous_time = {
                start_time:sd.format(new Date(), 'YYYY-MM-DD'),
                end_time:sd.format(new Date(), 'YYYY-MM-DD')
            };
        }
        return previous?{
            current:current_time,
            previous:previous_time
        }:current_time;
    }

    /**
     * 数据概览
     * @param request 
     * @param microtime 
     */
    export async function overview(request:any, microtime:number){
        let query = null;
        let method = request.method;
        let route = request.path;
        let paramsCode = '';
        let response:any = {
            overview_data:{},
            live_record:{},
            live_total:0,
            data_detail:{},
        };
        try{
            if(method == 'get'){
                query = request.query;
            }else if(method == 'post'){
                query = request.payload;
            }
            let platform = query.platform;
            let roomid = query.roomid;
            let time_type = query.time_type;
            let time = query.time;
            let page = query.page;
            let limit = query.limit;
            if(page <= 0){
                page = 1;
            }
            if(limit > 10){
                limit = 10;
            }
            if(limit <= 0){
                limit = 10;
            }
            paramsCode = md5(`${route}|${platform}|${roomid}|${time_type}|${time}|${page}|${limit}`);

            if(platform == constants.VIDEO_DOUYIN_PLAT_ID){
                platform = constants.LIVE_DOUYIN_PLAT_ID;
            }else if(platform == constants.VIDEO_KUAISHOU_PLAT_ID){
                platform = constants.LIVE_KUAISHOU_PLAT_ID;
            }

            let cacheRes:any = await redisHelper.get(`${redisHelper.P_DATA_POOL}${paramsCode}`);
            if(!utils.empty(cacheRes)){
                return utils.responseCommon(results['SUCCESS'], JSON.parse(cacheRes), {
                    microtime:microtime,
                    path:route,
                    resTime:utils.microtime()
                });
            }
            let live_record_res:any;
            let current_data:any;
            let previous_data:any;
            let data_detail:any;
            let time_param = timeParamFormatTransform(time_type, time);
            if(time_type == constants.TIME_TYPE_RECENT_TIME && utils.in_array(time, [constants.TIME_TYPE_RECENT_7, constants.TIME_TYPE_RECENT_30])){
                let type = 7;
                if(time == constants.TIME_TYPE_RECENT_30){
                    type = 30;
                }
                let current_res:any = await utils.getAsyncRequest(`${config['server_url_ten']}/getAnchorWeekAndMonthInfo`,{
                    plat_roomID_sets:`${platform},${roomid}`,
                    type:type,
                    date:time_param.current.end_time
                });
                let previous_res:any = await utils.getAsyncRequest(`${config['server_url_ten']}/getAnchorWeekAndMonthInfo`,{
                    plat_roomID_sets:`${platform},${roomid}`,
                    type:type,
                    date:time_param.previous.end_time
                });
                let data_detail_res:any = await utils.getAsyncRequest(`${config['server_url_ten']}/getXiaoHuLuIndex`,{
                    platID:platform,
                    roomID:roomid,
                    startDate:time_param.current.start_time,
                    endDate:time_param.current.end_time
                });
                live_record_res = await utils.getAsyncRequest(`${config['server_url_ten']}/getAnchorLiveInfoAndBase`,{
                    platID:platform,
                    roomID:roomid,
                    startTime:`${time_param.current.start_time} 00:00:00`,
                    endTime:`${time_param.current.end_time} 23:59:59`,
                    limitCount:50
                });
                current_data = overview_data_processor(JSON.parse(current_res)[0]);
                previous_data = overview_data_processor(JSON.parse(previous_res)[0]);
                data_detail = data_detail_processor(JSON.parse(data_detail_res), constants.TIME_TYPE_RECENT_TIME);
            }else{
                let current_res:any = await utils.getAsyncRequest(`${config['server_url_ten']}/getXiaoHuLuIndex`,{
                    platID:platform,
                    roomID:roomid,
                    startDate:time_param.current.start_time,
                    endDate:time_param.current.end_time
                });
                let previous_res:any = await utils.getAsyncRequest(`${config['server_url_ten']}/getXiaoHuLuIndex`,{
                    platID:platform,
                    roomID:roomid,
                    startDate:time_param.previous.start_time,
                    endDate:time_param.previous.end_time
                });
                live_record_res = await utils.getAsyncRequest(`${config['server_url_ten']}/getAnchorLiveInfoAndBase`,{
                    platID:platform,
                    roomID:roomid,
                    startTime:`${time_param.current.start_time} 00:00:00`,
                    endTime:`${time_param.current.end_time} 23:59:59`,
                    limitCount:50
                });
                current_data = single_overview_data_processor(JSON.parse(current_res)[0]);
                previous_data = single_overview_data_processor(JSON.parse(previous_res)[0]);
                data_detail = data_detail_processor(JSON.parse(current_res)[0], constants.TIME_TYPE_DAY);
            }
            let live_total = 0;
            let live_record_data:any;
            if(!utils.empty(live_record_res)){
                let body = JSON.parse(live_record_res);
                if(!utils.empty(body.data)){
                    let data = body.data;
                    live_total = data.length;
                    let start = (page-1)*limit;
                    let slice_data = data.slice(start, start+limit);
                    let live_ids = [];
                    for(let i = 0; i < slice_data.length; i++){
                        live_ids.push(slice_data[i].live_id);
                    }
                   
                    let live_goods_info:any = await utils.getAsyncRequest(`${config['server_url_ten']}/getAnchorGoodsSaleInfoByPlatRoomLive`,{
                        platID:platform,
                        roomID:roomid,
                        liveID:live_ids.join(',')
                    });
                    live_goods_info = live_goods_processor(JSON.parse(live_goods_info).data);
                    //TODO 部分数据处理逻辑未编写
                    live_record_data = live_record_data_processor(slice_data, live_goods_info);
                }
            }
            current_data.compare_virtual_coin = current_data.virtual_coin - previous_data.virtual_coin;
            current_data.compare_tycoon_count_sum = current_data.tycoon_count_sum - previous_data.tycoon_count_sum;
            current_data.compare_live_airtime_time = current_data.live_airtime_time - previous_data.live_airtime_time;
            current_data.compare_total_viewer_sum = current_data.total_viewer_sum - previous_data.total_viewer_sum;
            current_data.compare_total_viewer_max = current_data.total_viewer_max - previous_data.total_viewer_max;

            response.overview_data = current_data;
            response.live_record = live_record_data;
            response.live_total = live_total;
            response.data_detail = data_detail;

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
    function live_record_data_processor(data_list:any, live_goods:any){
        let live_list:any = [];
        if(!utils.empty(data_list)){
            for(let i = 0; i < data_list.length; i++){
                let temp = {
                    live_id:!utils.empty(data_list[i].live_id)?data_list[i].live_id:'',
                    live_img:!utils.empty(data_list[i].live_img)?data_list[i].live_img:'',
                    is_live:!utils.empty(data_list[i].is_live)?data_list[i].is_live:0,
                    title:!utils.empty(data_list[i].title)?data_list[i].title:'',
                    is_shopping:!utils.empty(data_list[i].is_shopping)?data_list[i].is_shopping:0,
                    start_time:!utils.empty(data_list[i].start_time)?sd.format(data_list[i].start_time, 'YYYY-MM-DD HH:mm:ss'):'',
                    end_time:!utils.empty(data_list[i].end_time)?sd.format(data_list[i].end_time, 'YYYY-MM-DD HH:mm:ss'):'',
                    update_time:!utils.empty(data_list[i].update_time)?sd.format(data_list[i].update_time, 'YYYY-MM-DD HH:mm:ss'):'',
                    virtual_coin:!utils.empty(data_list[i].all_gift_price)?data_list[i].all_gift_price:0,
                    tycoon_count_sum:!utils.empty(data_list[i].tycoon_sender)?data_list[i].tycoon_sender:0,
                    live_airtime_time:!utils.empty(data_list[i].live_time)?parseFloat((parseInt(data_list[i].live_time)/60).toFixed(2)):0,
                    total_viewer_sum:!utils.empty(data_list[i].totalViewer)?data_list[i].totalViewer:0,
                    total_viewer_max:!utils.empty(data_list[i].maxViewCount)?data_list[i].maxViewCount:0,
                    new_fans_num:!utils.empty(data_list[i].new_followNumber)?data_list[i].new_followNumber:0,
                    total_income:0,
                    order_num:0,
                    price:0,
                    sales_price:[],
                    sales_number:[],
                    online_viewer:!utils.empty(data_list[i].online_viewer)?data_list[i].online_viewer:[],
                    total_viewer:!utils.empty(data_list[i].total_viewer)?data_list[i].total_viewer:[]
                }
                if(!utils.empty(live_goods[data_list[i].live_id])){
                    temp.total_income = live_goods[data_list[i].live_id].total_income;
                    temp.order_num = live_goods[data_list[i].live_id].order_num;
                    temp.price = !utils.empty(temp.order_num)?parseFloat((temp.total_income/temp.order_num).toFixed(2)):0;
                    // if(live_goods[data_list[i].live_id].trend){
                    //     temp.sales_price = live_record_trend_processor(live_goods[data_list[i].live_id].trend.sales_price);
                    //     temp.sales_number = live_record_trend_processor(live_goods[data_list[i].live_id].trend.sales_number);
                    // }
                }
                live_list.push(temp);
            }
        }

        return live_list;
    }

    function live_record_trend_processor(trend_data:any){
        let data_list:any = [];
        if(!utils.empty(trend_data)){

        }
        return data_list;
    }

    function overview_data_processor(data:any){
        if(!utils.empty(data)){
            return {
                virtual_coin:!utils.empty(data.dyValue_add)?(data.dyValue_add/10):0,
                tycoon_count_sum:!utils.empty(data.tyrant_count_sum)?data.tyrant_count_sum:0,
                live_airtime_time:!utils.empty(data.live_airtime_time)?parseFloat((parseInt(data.live_airtime_time)/60).toFixed(2)):0,
                total_viewer_sum:!utils.empty(data.total_viewer_sum)?data.total_viewer_sum:0,
                total_viewer_max:!utils.empty(data.total_viewer_max)?data.total_viewer_max:0,
                update_time:!utils.empty(data.update_time)?sd.format(data.update_time, 'YYYY-MM-DD HH:mm:ss'):''
            };
        }else{
            return {
                virtual_coin:0,
                tycoon_count_sum:0,
                live_airtime_time:0,
                total_viewer_sum:0,
                total_viewer_max:0,
                update_time:''
            };
        }
    }
    function single_overview_data_processor(data:any){
        if(!utils.empty(data)){
            return {
                virtual_coin:!utils.empty(data.dyValue_add)?(data.dyValue_add/10):0,
                tycoon_count_sum:!utils.empty(data.tyrant_count)?data.tyrant_count:0,
                live_airtime_time:!utils.empty(data.air_time)?parseFloat((parseInt(data.air_time)/60).toFixed(2)):0,
                total_viewer_sum:!utils.empty(data.totalViewer)?data.totalViewer:0,
                total_viewer_max:!utils.empty(data.onlineViewerMax)?data.onlineViewerMax:0,
                update_time:!utils.empty(data.update_time)?sd.format(data.update_time, 'YYYY-MM-DD HH:mm:ss'):''
            };
        }else{
            return {
                virtual_coin:0,
                tycoon_count_sum:0,
                live_airtime_time:0,
                total_viewer_sum:0,
                total_viewer_max:0,
                update_time:''
            };
        }
    }
    function live_goods_processor(live_goods_list:any){
        let data_list:any = {};
        if(!utils.empty(live_goods_list)){
            for(let i = 0; i < live_goods_list.length; i++){
                let total_income = 0;
                let order_num = 0;
                if(!utils.empty(live_goods_list[i].dyScene_sales_number) && !utils.empty(live_goods_list[i].min_price)){
                    total_income = (live_goods_list[i].dyScene_sales_number*live_goods_list[i].min_price) / 100;
                    order_num = live_goods_list[i].dyScene_sales_number;
                }
                if(!utils.empty(data_list[live_goods_list[i].live_id])){
                    data_list[live_goods_list[i].live_id].total_income += total_income;
                    data_list[live_goods_list[i].live_id].order_num += order_num;
                    data_list[live_goods_list[i].live_id].product_id.concat(live_goods_list[i].product_id);
                }else{
                    data_list[live_goods_list[i].live_id] = {
                        total_income:total_income,
                        order_num:order_num,
                        product_id:live_goods_list[i].product_id
                    }
                }
                data_list[live_goods_list[i].live_id].total_income = parseFloat(data_list[live_goods_list[i].live_id].total_income.toFixed(2));
            }
        }
        return data_list;
    }
    function data_detail_processor(data_info:any, time_type:string){
        let virtual_coin:any = [];
        let online_viewer:any = [];
        if(!utils.empty(data_info)){
            if(time_type == constants.TIME_TYPE_DAY){
                if(!utils.empty(data_info.dyValueTrend)){
                    virtual_coin = JSON.parse(data_info.dyValueTrend);
                }
                if(!utils.empty(data_info.onlineViewerTrend)){
                    online_viewer = JSON.parse(data_info.onlineViewerTrend);
                }
                virtual_coin = data_detail_processor_branch(virtual_coin, 'virtual_coin', data_info.dyValue_add);
                online_viewer = data_detail_processor_branch(online_viewer, 'online_viewer');
            }else{
                for(let i = 0; i < data_info.length; i++){
                    if(!utils.empty(data_info[i].statistics_date) && !utils.empty(data_info[i].dyValue_add)){
                        virtual_coin.push({
                            time:data_info[i].statistics_date,
                            value:data_info[i].dyValue_add
                        });
                    }
                    if(!utils.empty(data_info[i].statistics_date) && !utils.empty(data_info[i].onlineViewerMax)){
                        online_viewer.push({
                            time:data_info[i].statistics_date,
                            value:data_info[i].onlineViewerMax
                        });
                    }
                }
            }
        }
        return {
            virtual_coin:virtual_coin,
            online_viewer:online_viewer
        }
    }
    function data_detail_processor_branch(data_list:any, type:string = 'virtual_coin', virtual_coin_add = 0){
        if(!utils.empty(data_list)){
            let basic_val = 0;
            let other_virtual_total = 0;
            virtual_coin_add = virtual_coin_add/10;
            for(let i = 0; i < data_list.length; i++){
                if(type == 'virtual_coin'){
                    data_list[i].initial = data_list[i].value;
                    if(i == 0){
                        data_list[i].value = 0;
                    }else{
                        if(data_list[i].value == 0){
                            delete data_list[i];
                            continue;
                        }
                        data_list[i].value = (data_list[i].value - basic_val) / 10;
                        other_virtual_total += data_list[i].value;
                    }
                    basic_val = data_list[i].initial;
                }else{
                    if(data_list[i].value <= 1){
                        delete data_list[i];
                        continue;
                    }
                }
                data_list[i].time = sd.format(new Date(data_list[i].time*1000), 'HH:mm');
            }
            if(!utils.empty(virtual_coin_add) && virtual_coin_add > other_virtual_total){
                data_list[0].value = virtual_coin_add-other_virtual_total;
            }
        }
        return data_list;
    }

    /**
     * 获取主播直播记录
     * @param request 
     * @param microtime 
     */
    export async function anchor_live_record(request:any, microtime:number){
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
            let platform = query.platform;
            let roomid = query.roomid;
            let time_type = query.time_type;
            let time = query.time;
            let page = query.page;
            let limit = query.limit;
            if(page <= 0){
                page = 1;
            }
            if(limit > 10){
                limit = 10;
            }
            if(limit <= 0){
                limit = 10;
            }
            paramsCode = md5(`${route}|${platform}|${roomid}|${time_type}|${time}|${page}|${limit}`);

            if(platform == constants.VIDEO_DOUYIN_PLAT_ID){
                platform = constants.LIVE_DOUYIN_PLAT_ID;
            }else if(platform == constants.VIDEO_KUAISHOU_PLAT_ID){
                platform = constants.LIVE_KUAISHOU_PLAT_ID;
            }

            let cacheRes:any = await redisHelper.get(`${redisHelper.P_DATA_POOL}${paramsCode}`);
            if(!utils.empty(cacheRes)){
                return utils.responseCommon(results['SUCCESS'], JSON.parse(cacheRes), {
                    microtime:microtime,
                    path:route,
                    resTime:utils.microtime()
                });
            }
            let list:any = [];
            let time_param = timeParamFormatTransform(time_type, time);
            let days30_res:any = await utils.getAsyncRequest(`${config['server_url_five']}/getSchedulerByRoomAndTime_30days`,{
                platID:platform,
                roomID:roomid,
                limitCount:100,
                IsEXISTAirtimeBaseTable:1,
                startTime:`${time_param.current.start_time} 00:00:00`,
                endTime:`${time_param.current.end_time} 23:59:59`
            });
            let days30_ret = JSON.parse(days30_res);
            if(utils.empty(days30_ret) || days30_ret.code == 0){
                // response.list = list;
            }else{
                let data = days30_ret.data;
                let total = data.length;
                let start = (page-1)*limit;
                let slice_data = data.slice(start, start+limit);
                for(let i = 0; i < slice_data.length; i++){
                    let details:any = await getLiveDataByTaskId(slice_data[i].id);
                    list.push({
                        task_id:slice_data[i].id,
                        update_time:sd.format(slice_data[i].update_time, 'YYYY-MM-DD HH:mm:ss'),
                        sum_gift_price:details.all_gift_price,
                        charge_gift_price:details.charge_gift_price,
                        all_gift_price:details.all_gift_price,
                        free_gift_price:details.free_gift_price,
                        charge_gift_sender:details.charge_gift_sender,
                        focus_grouth:await getAnchorLiveNewSubscribe(platform,roomid,utils.tomest(slice_data[i].live_start_time),utils.tomest(slice_data[i].live_end_time)),
                        msg_count:details.msg_count,
                        msg_sender:details.msg_sender,
                        airtime:utils.formatAirTime(details.airtime),
                        live_pic_url:slice_data[i].url,
                        title:slice_data[i].title,
                        live_start_time:!utils.empty(details.live_start_time)?details.live_start_time:slice_data[i].live_start_time,
                        live_end_time:!utils.empty(details.live_last_time)?details.live_last_time:slice_data[i].live_end_time,
                        statistics_date:slice_data[i].statistics_date,
                        sourcegname:slice_data[i].sourcegname,
                        max_hot:await _getLiveMaxHot(platform,roomid,utils.tomest(slice_data[i].live_start_time),utils.tomest(slice_data[i].live_end_time)),
                        gift_value_percent_json:details.gift_value_percent_json,
                        gift_sender_percent_json:details.gift_sender_percent_json,
                        gift_sender_top_json:details.gift_sender_top_json,
                        msg_sender_top_json:details.msg_sender_top_json,
                        msg_send_frequency_json:details.msg_send_frequency_json,
                        gift_value_timeline_json:details.gift_value_timeline_json,
                        msg_timeline_json:details.msg_timeline_json,
                        live_status:!utils.empty(slice_data[i].live_end_time)?false:true,
                        total_income:0,
                        order_num:0,
                        price:0
                    });
                }
                response.total = total;
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
    async function getLiveDataByTaskId(taskId:string){
        let details = {};
        try {
            let taskRes:any = await utils.getAsyncRequest(`${config['server_url_five']}/getSchedulerByTaskID`,{
                taskID:taskId
            });
            let body = JSON.parse(taskRes);
            if(!utils.empty(body) && body.code == 1){
                details = body.data;
            }
        } catch (error) {
            console.log(error);
        }finally{
            return details;
        }
    }
    async function getAnchorLiveNewSubscribe(platform:number, roomid:string, start:number, end:number){
        let details = {};
        try {
            let res:any = await utils.getAsyncRequest(`${config['server_url_six']}/getAnchorFansnumChangeByDate`,{
                platID:platform,
                roomID:roomid,
                startTime:start,
                endTime:utils.empty(end)?utils.tomest():end
            });
            let body = JSON.parse(res);
            if(!utils.empty(body) && body.code == 0){
                details = body.data;
            }
        } catch (error) {
            console.log(error);
        }finally{
            return details;
        }
    }
    async function _getLiveMaxHot(platform:number, roomid:string, start:number, end:number){
        let details = {};
        try {
            let res:any = await utils.getAsyncRequest(`${config['server_url_six']}/getAnchorSamCountAndMaxPopularityByTime`,{
                platID:platform,
                roomID:roomid,
                startTime:start,
                endTime:utils.empty(end)?utils.tomest():end
            });
            let body = JSON.parse(res);
            if(!utils.empty(body) && body.code == 0){
                details = body.data;
            }
        } catch (error) {
            console.log(error);
        }finally{
            return details;
        }
    }
    /**
     * 主播直播综合数据
     * @param request 
     * @param microtime 
     */
    export async function anchor_live_comprehensive_data(request:any, microtime:number){
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
            let platform = query.platform;
            let roomid = query.roomid;
            let time_type = query.time_type;
            let time = query.time;
            paramsCode = md5(`${route}|${platform}|${roomid}|${time_type}|${time}`);

            if(platform == constants.VIDEO_DOUYIN_PLAT_ID){
                platform = constants.LIVE_DOUYIN_PLAT_ID;
            }else if(platform == constants.VIDEO_KUAISHOU_PLAT_ID){
                platform = constants.LIVE_KUAISHOU_PLAT_ID;
            }

            let cacheRes:any = await redisHelper.get(`${redisHelper.P_DATA_POOL}${paramsCode}`);
            if(!utils.empty(cacheRes)){
                return utils.responseCommon(results['SUCCESS'], JSON.parse(cacheRes), {
                    microtime:microtime,
                    path:route,
                    resTime:utils.microtime()
                });
            }
            let list:any = [];
            let time_param = timeParamFormatTransform(time_type, time);
            let data:any = await getLiveComprehensiveData(platform, roomid, time_param.current.start_time, time_param.current.end_time);
            let pre_data:any = await _getPreData(platform, roomid, time_param.current.start_time, time_param.current.end_time, time);
            data.add_all_gift_price = data.all_gift_price - pre_data.all_gift_price;
            data.add_charge_gift_price = data.charge_gift_price - pre_data.charge_gift_price;
            data.add_free_gift_price = data.free_gift_price - pre_data.free_gift_price;
            data.add_all_gift_sender = data.all_gift_sender - pre_data.all_gift_sender;
            data.add_msg_count = data.msg_count - pre_data.msg_count;
            data.add_msg_sender = data.msg_sender - pre_data.msg_sender;
            if(utils.in_array(time, [constants.TIME_TYPE_TODAY, constants.TIME_TYPE_YESTERDAY])){
                data.airtime = await getAnchorLiveAirtimeSingleDay(platform, roomid, time);
            }
            data.live_status = !utils.empty(data.airtime) && data.airtime > 0 ? true:false;
            //TODO 小葫芦指数有待商榷
            data.line = [];
            // let xiaohulu_index = (time_param.current.start_time == time_param.current.end_time)?[]:await getXiaoHuLuIndex(platform, )

            response = data;
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

    /**
     * 今日昨日直播综合时长计算
     */
    async function getAnchorLiveAirtimeSingleDay(platform:number, roomid:string, time:string){
        let airtime = 0;
        try {
            if(!utils.in_array(time, [constants.TIME_TYPE_TODAY, constants.TIME_TYPE_YESTERDAY])){
                return airtime;
            }
            let days30_res:any = await utils.getAsyncRequest(`${config['server_url_five']}/getSchedulerByRoomAndTime_30days`,{
                platID:platform,
                roomID:roomid,
                limitCount:100,
                IsEXISTAirtimeBaseTable:1
            });
            let days30_ret = JSON.parse(days30_res);
            let list = [];
            if(!utils.empty(days30_ret.data)){
                list = days30_ret.data;
                let datetime = '';
                let tomorrow = utils.tomest(sd.format(+new Date()+24*60*60*1000, 'YYYY-MM-DD'));
                if(time == constants.TIME_TYPE_TODAY){
                    datetime = sd.format(new Date(), 'YYYY-MM-DD');
                }else{
                    datetime = sd.format(+new Date()-24*60*60*1000, 'YYYY-MM-DD');
                }
                for(let i = 0; i < list.length; i++){
                    let end = utils.empty(list[i].live_end_time)?utils.tomest():utils.tomest(list[i].live_end_time);
                    end = (end > tomorrow)?tomorrow:end;
                    let start = utils.tomest(list[i].live_start_time) < utils.tomest(datetime)?utils.tomest(datetime):utils.tomest(list[i].live_start_time);
                    let single_airtime = end > start ?end-start:0;
                    airtime += single_airtime;
                }
                return parseFloat((airtime/3600).toFixed(1)) > 24?24:parseFloat((airtime/3600).toFixed(1));
            }else{
                return airtime;
            }

        } catch (error) {
            console.log(error);
        }finally{
            return airtime;
        }
    }
    async function _getPreData(platform:number, roomid:string, start:string, end:string, time:string){
        let details = {};
        try {
            if(time == constants.TIME_TYPE_RECENT_30){
                details = await getOldComprehensiveData(platform, roomid, start, end, time);
            }else if(time == constants.TIME_TYPE_RECENT_7){
                details = await getOldComprehensiveData(platform, roomid, start, end, time);
            }else{
                let last_time = sd.format(+new Date(start)-24*60*60*1000, 'YYYY-MM-DD');
                details = await getLiveComprehensiveData(platform, roomid, last_time, last_time);
            }
            let res:any = await utils.getAsyncRequest(`${config['server_url_five']}/getTodayBaseTableAnchorLiveInfoSumData`,{
                platID:platform,
                roomID:roomid,
                startDate:start,
                endDate:end
            });
            let body = JSON.parse(res);
            if(!utils.empty(body.data) && body.code == 1){
                
            }
        } catch (error) {
            console.log(error);
        }finally{
            return details;
        }
    }
    async function getOldComprehensiveData(platform:number, roomid:string, start:string, end:string, time:string){
        let details = {};
        try {
            let def = _getDefaultComprehensiveData(platform, roomid);
            let params:any = {
                platID:platform,
                roomID:roomid,
            }
            if(time == constants.TIME_TYPE_RECENT_7){
                params['dayCount'] = 7;
                params['endDate'] = sd.format(+new Date(end)-24*60*60*1000*7, 'YYYY-MM-DD');
            }else if(time == constants.TIME_TYPE_RECENT_30){
                params['dayCount'] = 30;
                params['endDate'] = sd.format(+new Date(utils.date(`YYYY-MM-01`))-24*60*60*1000, 'YYYY-MM-DD');
            }
            let res:any = await utils.getAsyncRequest(`${config['server_url_five']}/getAnchorLiveMonthWeekSumData`,params);
            let body = JSON.parse(res);
            if(utils.empty(body.anchorLiveMonthWeekList)){
                return def; 
            }else{
                let res = body.anchorLiveMonthWeekList[0];
                for(let o of Object.keys(res)){
                    if(utils.empty(res[o])){
                        res[o] = 0;
                    }
                }
                res.msg_count = res.msg_count_sum;
                res.msg_sender = res.msg_sender_count_sum;
                res.maxViewCount = res.max_view_count;
                res.airtime = utils.formatAirTime(res.airtime_sum);
                details = res;
            }
        } catch (error) {
            console.log(error);
        }finally{
            return details;
        }
    }
    function _getDefaultComprehensiveData(platform:number, roomid:string){
        return {
            platform_id : platform,
            room_id : roomid,
            all_gift_price : 0,
            charge_gift_price : 0,
            free_gift_price : 0,
            all_gift_sender : 0,
            charge_gift_sender : 0,
            free_gift_sender : 0,
            active_sender : 0,
            maxViewCount : 0,
            new_followNumber : 0,
            msg_count : 0,
            msg_sender : 0,
        }
    }
    async function getLiveComprehensiveData(platform:number, roomid:string, start:string, end:string){
        let details:any = _getDefaultComprehensiveData(platform, roomid);
        try {
            let res:any = await utils.getAsyncRequest(`${config['server_url_five']}/getTodayBaseTableAnchorLiveInfoSumData`,{
                platID:platform,
                roomID:roomid,
                startDate:start,
                endDate:end
            });
            let body = JSON.parse(res);
            if(!utils.empty(body.data) && body.code == 1){
                details = body.data;
                for(let o of Object.keys(details)){
                    if(utils.empty(details[o])){
                        details[o] = 0;
                    }
                }
                details.airtime = utils.formatAirTime(details.airtime);
            }
        } catch (error) {
            console.log(error);
        }finally{
            return details;
        }
    }
    
    /**
     * 粉丝画像
     * @param request 
     * @param microtime 
     */
    export async function portrait(request:any, microtime:number){
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
            let platform = query.platform;
            let roomid = query.roomid;
            let type = query.type;
            paramsCode = md5(`${route}|${platform}|${roomid}|${type}`);

            let _constellation:any = {
                '1' : '白羊座', '2' : '金牛座', '3' : '双子座', '4' : '巨蟹座',
                '5' : '狮子座', '6' : '处女座', '7' : '天秤座', '8' : '天蝎座',
                '9' : '射手座', '10' : '摩羯座', '11' : '水瓶座', '12' : '双鱼座',
            };

            switch(type){
                case 1://性别分布
                case 2://星座分布
                case 5://年龄分布
                case 6://地域分布
                    let res:any = await utils.getAsyncRequest(`${config['server_url_four']}/api/v1/shortvideo/author/fan/analysis`, {
                        platId:platform,
                        roomId:roomid
                    });
                    let ret = JSON.parse(res);
                    if(ret.code == 0 && !utils.empty(ret.data)){
                        let data = JSON.parse(ret.data);
                        if(type == 1){
                            if(!utils.empty(data.gender)){
                                response = data.gender;
                            }
                        }else if(type == 2){
                            if(!utils.empty(data.constellation)){
                                for(let o of Object.keys(_constellation)){
                                    response[_constellation[o]] = data.constellation[`constellatio_${o}`];
                                }
                            }
                        }else if(type == 5){
                            if(!utils.empty(data.age)){
                                let range:any = {
                                    '6':'其他',
                                    '18':'18-25岁',
                                    '26':'26-32岁',
                                    '33':'33-39岁',
                                    '40':'40岁以上'
                                };
                                let sum = 0;
                                for(let o of Object.keys(data.age)){
                                    let ary:any = o.split('_');
                                    if(!utils.empty(ary) && ary[0] == 'age' && !isNaN(ary[1])){
                                        response[range[ary[1]]] = data.age[o];
                                        sum += data.age[o];
                                    }
                                }
                                for(let o of Object.keys(response)){
                                    response[o] = parseFloat((parseFloat((response[o]/sum).toFixed(4))*100).toFixed(2));
                                }
                            }
                        }else if(type == 6){
                            if(!utils.empty(data.location)){
                                let sum = 0;
                                for(let i = 0; i < data.location.length; i++){
                                    sum += data.location[i].count;
                                }
                                for(let i = 0; i < data.location.length; i++){
                                    let location_name = data.location[i].location_name;
                                    location_name.replace(/省/g,'');
                                    location_name.replace(/自治区/g,'');
                                    location_name.replace(/回族/g,'');
                                    location_name.replace(/壮族/g,'');
                                    location_name.replace(/维吾尔/g,'');
                                    location_name.replace(/特别行政区/g,'');
                                    response[location_name] = {
                                        count:data.location[i].count,
                                        percent:`${parseFloat((parseFloat((data.location[i].count/sum).toFixed(4))*100).toFixed(2))}%`
                                    };
                                }
                            }
                        }
                    }
                    break;
                case 3://粉丝活跃时间分布-按天
                case 4://粉丝活跃时间分布-按周
                    let res2:any = await utils.getAsyncRequest(`${config['server_url_four']}/api/v1/shortvideo/author/comment/analysis`, {
                        platId:platform,
                        roomId:roomid
                    });
                    let ret2 = JSON.parse(res2);
                    if(ret2.code == 0 && !utils.empty(ret2.data)){
                        let data = ret2.data;
                        if(!utils.empty(data.day)){
                            let sum = 0;
                            for(let i = 0; i < data.day.length; i++){
                                sum += data.day[i].count;
                            }
                            if(type == 3){
                                for(let i = 0; i < data.day.length; i++){
                                    response[data.day[i].date] = parseFloat((parseFloat((data.day[i].count/sum).toFixed(4))*100).toFixed(2));
                                }
                            }
                        }
                        if(!utils.empty(data.week)){
                            let week:any = {
                                '0' : '星期日',
                                '1' : '星期一',
                                '2' : '星期二',
                                '3' : '星期三',
                                '4' : '星期四',
                                '5' : '星期五',
                                '6' : '星期六',
                            };
                            let sum = 0;
                            for(let i = 0; i < data.week.length; i++){
                                sum += data.week[i].count;
                            }
                            if(type == 4){
                                for(let i = 0; i < data.week.length; i++){
                                    response[week[data.week[i].date]] = parseFloat((parseFloat((data.week[i].count/sum).toFixed(4))*100).toFixed(2));
                                }
                            }
                        }
                    }
                    break;
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