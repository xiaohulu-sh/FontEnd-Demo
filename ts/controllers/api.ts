import { compile, date, required } from '@hapi/joi';
import { platform } from 'os';
import { redisHelper } from '../library/redisHelper';
import { utils } from '../library/utils';
const config = require('../../config.json');
const results = require('../../results.json');
const sd = require('silly-datetime');
const md5 = require('md5');
import { constants } from '../library/constants';
import { illegal } from '@hapi/boom';
import { head } from 'request';

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
            live_basic_data:{},
            video_basic_data:{}
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
            if(platform == constants.VIDEO_DOUYIN_PLAT_ID){
                let basic_info = await dy_basic_info(constants.LIVE_DOUYIN_PLAT_ID, platform, roomid);
                let live_basic_data = dy_live_basic_data_processor(basic_info.live_basic_data, basic_info.live_count_data,basic_info.live_rank);
                let video_basic_data = video_basic_count_data_processor(basic_info.video_basic_data, basic_info.video_count_data);
                response.live_basic_data = live_basic_data;
                response.video_basic_data = video_basic_data;
            }else if(platform == constants.VIDEO_KUAISHOU_PLAT_ID){
                let basic_info = await ks_basic_info(constants.LIVE_KUAISHOU_PLAT_ID, platform, roomid);
                let live_basic_data = ks_live_basic_data_processor(basic_info.live_data,basic_info.baike_data, basic_info.shop_data,constants.LIVE_DOUYIN_PLAT_ID,roomid);
                let video_basic_data = video_basic_count_data_processor(basic_info.video_basic_data, basic_info.video_count_data);
                response.live_basic_data = live_basic_data;
                response.video_basic_data = video_basic_data;
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
    function video_basic_count_data_processor(basic_data:any, count_data:any = {}){
        let res:any = {
            nickname:utils.defaultVal(basic_data.nickname, basic_data.nickname, ''),
            avatar:utils.defaultVal(basic_data.avatar, basic_data.avatar, ''),
            sex:utils.defaultVal(basic_data.gender, basic_data.gender, 0),
            age:utils.defaultVal(basic_data.age, basic_data.age, 0),
            location:utils.defaultVal(basic_data.location_name, basic_data.location_name, ''),
            description:utils.defaultVal(basic_data.description, basic_data.description, ''),
            tagName:utils.defaultVal(basic_data.tagName, basic_data.tagName, ''),
            certification:utils.defaultVal(basic_data.certification, basic_data.certification, ''),
            room_id:utils.defaultVal(basic_data.room_id, basic_data.room_id, ''),
            display_id:utils.defaultVal(basic_data.unique_id, basic_data.unique_id, utils.defaultVal(basic_data.user_id, basic_data.user_id,'')),
            is_live:utils.defaultVal(basic_data.is_live, basic_data.is_live, 0),
            user_source_link:utils.defaultVal(basic_data.source_link, basic_data.source_link, ''),
            live_source_link:utils.defaultVal(basic_data.live_source_link, basic_data.live_source_link, ''),
            fans_num:utils.defaultVal(basic_data.fans_num, basic_data.fans_num, 0),
            favorited_num:utils.defaultVal(basic_data.favorited_num, basic_data.favorited_num, 0),
            follow_num:utils.defaultVal(basic_data.follow_num, basic_data.follow_num, 0),
            plat_rank:utils.defaultVal(count_data.plat_rank, count_data.plat_rank, ''),
            super_rate:utils.defaultVal(count_data.super_rate, count_data.super_rate+'%', ''),
            favorited_comment_rate:utils.defaultVal(count_data.favorited_comment_rate, count_data.favorited_comment_rate, ''),
            xhl_index:utils.defaultVal(count_data.xhl_index, count_data.xhl_index, 0),
        };
        if(res.certification=='true'){
            res.certification = '已认证';
        }else if(res.certification=='false'){
            res.certification = '';
        }
        if(utils.empty(res.description) && res.room_id == '4195355415549012'){
            res.description = '前锤子科技CEO，现任交个朋友科技首席推荐官';
        }
        return res;
    }

    function ks_live_basic_data_processor(basic_data:any, baike_data:any = {}, shop_data:any = {}, plat_id:number=0, room_id:string=''){
        let res:any = {
            nickname:utils.defaultVal(basic_data.emcee, basic_data.emcee, utils.defaultVal(shop_data.nickname, shop_data.nickname, '')),
            sex:utils.defaultVal(shop_data.gender, shop_data.gender, 0),
            age:utils.defaultVal(shop_data.age, shop_data.age, 0),
            location:utils.defaultVal(shop_data.location, shop_data.location, ''),
            display_id:utils.defaultVal(shop_data.display_id, shop_data.display_id, ''),
            is_live:utils.defaultVal(shop_data.is_live, shop_data.is_live, 0),
            user_source_link:utils.defaultVal(basic_data.home_source_link, basic_data.home_source_link, utils.defaultVal(shop_data.user_source_link, shop_data.user_source_link, '')),
            live_source_link:utils.defaultVal(basic_data.source_link, basic_data.source_link, utils.defaultVal(shop_data.live_source_link, shop_data.live_source_link, '')),
            virtual_coin:utils.defaultVal(shop_data.dyValue, shop_data.dyValue, 0),
            fans_num:utils.defaultVal(basic_data.follow_number, basic_data.follow_number, utils.defaultVal(shop_data.fansCount, shop_data.fansCount, 0)),
            online_viewer_num:utils.defaultVal(shop_data.onlineViewer, shop_data.onlineViewer, 0),
            total_viewer_num:utils.defaultVal(shop_data.totalViewer, shop_data.totalViewer, 0),
            field:utils.defaultVal(shop_data.field, shop_data.field, ''),
            tagName:utils.defaultVal(baike_data.labels, baike_data.labels, ''),
            description:utils.defaultVal(baike_data.introduction, baike_data.introduction, ''),
            xhl_index:'',
            douyin_rank:''
        };
        res.avatar = `https://xhlcdn.xiaohulu.com/avatar/${plat_id}/${room_id}`;
        if(!utils.empty(basic_data.tagName)){
            basic_data.tagName = baike_data.labels.split(',');
        }
        return res;
    }
    function dy_live_basic_data_processor(basic_data:any, count_data:any = {}, live_rank:number = 0){
        let res:any = {
            nickname:utils.defaultVal(basic_data.nickname, basic_data.nickname, ''),
            avatar:utils.defaultVal(basic_data.head, basic_data.head, ''),
            sex:utils.defaultVal(basic_data.gender, basic_data.gender, 0),
            age:utils.defaultVal(basic_data.age, basic_data.age, 0),
            location:utils.defaultVal(basic_data.location, basic_data.location, ''),
            description:utils.defaultVal(basic_data.introduce, basic_data.introduce, ''),
            tagName:utils.defaultVal(basic_data.tagName, basic_data.tagName, ''),
            display_id:utils.defaultVal(basic_data.display_id, basic_data.display_id, ''),
            is_live:utils.defaultVal(basic_data.is_live, basic_data.is_live, 0),
            user_source_link:utils.defaultVal(basic_data.user_source_link, basic_data.user_source_link, ''),
            live_source_link:utils.defaultVal(basic_data.live_source_link, basic_data.live_source_link, ''),
            field:utils.defaultVal(basic_data.field, basic_data.field, ''),
            xhl_index:utils.defaultVal(count_data.xhl_index, count_data.xhl_index, 0),
            douyin_rank:utils.defaultVal(live_rank, live_rank, 0),
            virtual_coin:utils.defaultVal(basic_data.dyValue, parseFloat((basic_data.dyValue/10).toFixed(2)), 0),
            online_viewer_num:utils.defaultVal(basic_data.onlineViewer, basic_data.onlineViewer, 0),
            total_viewer_num:utils.defaultVal(basic_data.fansCount, basic_data.totalViewer, 0),
        };
        if(basic_data.is_live == 0){
            basic_data.online_viewer_num = 0;
        }
        return res;
    }
    async function dy_basic_info(live_pid:number, video_pid:number, room_id:string){
        let res:any = {
            live_basic_data:{},
            live_count_data:{},
            live_rank:0,
            video_basic_data:{},
            video_count_data:{}
        };
        try {
            let yesterday = sd.format(+new Date()-24*60*60*1000, 'YYYY-MM-DD');
            let live_basic_data_res:any = await utils.getAsyncRequest(`${config['server_url_ten']}/getAnchorInfoByPlatRoomIDSet`,{
                plat_roomID_sets:`${live_pid},${room_id}`,
            });
            let live_basic_data_ret = JSON.parse(live_basic_data_res);
            if(!utils.empty(live_basic_data_ret)){
                res.live_basic_data = live_basic_data_ret[0];
            }else{
                res.live_basic_data = {};
            }
            let live_count_data_res:any = await utils.getAsyncRequest(`${config['server_url_ten']}/getAnchorWeekAndMonthInfo`,{
                plat_roomID_sets:`${live_pid},${room_id}`,
                type:7,
                date:yesterday
            });
            let live_count_data_ret = JSON.parse(live_count_data_res);
            if(!utils.empty(live_count_data_ret)){
                res.live_count_data = live_count_data_ret[0];
            }else{
                res.live_count_data = {};
            }
            let live_rank_res:any = await utils.getAsyncRequest(`${config['server_url_one']}/getBatchWholeNetworkRankingOfDay`,{
                platroomIds:`${live_pid},${room_id}`,
                date:yesterday
            });
            let live_rank_ret = JSON.parse(live_rank_res);
            if(!utils.empty(live_rank_ret)){
                live_rank_ret = live_rank_ret[0];
                let live_rank = 0;
                if(!utils.empty(live_rank_ret)){
                    if(!utils.empty(live_rank_ret.rank)){
                        live_rank = live_rank_ret.rank;
                    }
                }
                res.live_rank = live_rank;
            }else{
                res.live_rank = 0;
            }
            let video_basic_data_res:any = await utils.getAsyncRequest(`${config['server_url_four']}/api/v1/shortvideo/author/detail/get`,{
                platId:video_pid,
                roomId:room_id
            });
            let video_basic_data_ret = JSON.parse(video_basic_data_res);
            let video_basic_data = {};
            if(video_basic_data_ret.code == 0 && !utils.empty(video_basic_data_ret.data)){
                video_basic_data = video_basic_data_ret.data;
            }
            res.video_basic_data = video_basic_data;
            let video_count_data_res:any = await utils.getAsyncRequest(`${config['server_url_four']}/api/v1/shortvideo/author/xhlscore/get`,{
                platId:video_pid,
                roomId:room_id
            });
            let video_count_data_ret = JSON.parse(video_count_data_res);
            let video_count_data = {};
            if(video_count_data_ret.code == 0 && !utils.empty(video_count_data_ret.data)){
                video_count_data = video_count_data_ret.data;
            }
            res.video_count_data = video_count_data;
        } catch (error) {
            console.log(error);
        }finally{
            return res;
        }
    }
    async function ks_basic_info(live_pid:number, video_pid:number, room_id:string){
        let res:any = {
            shop_data:{},
            live_data:{},
            baike_data:{},
            video_basic_data:{},
            video_count_data:{}
        };
        try {
            let shop_data_res:any = await utils.getAsyncRequest(`${config['server_url_ten']}/getAnchorInfoByPlatRoomIDSet`,{
                plat_roomID_sets:`${live_pid},${room_id}`,
            });
            let shop_data_ret = JSON.parse(shop_data_res);
            if(!utils.empty(shop_data_ret)){
                res.shop_data = shop_data_ret[0];
            }else{
                res.shop_data = {};
            }
            let live_data_res:any = await utils.getAsyncRequest(`${config['server_url_one']}/getAnchorInfobyPlatAndRoomID`,{
                platID:live_pid,
                roomID:room_id
            });
            if(!utils.empty(live_data_res)){
                let live_data_ret = JSON.parse(live_data_res);
                if(!utils.empty(live_data_ret)){
                    res.live_data = live_data_ret;
                }else{
                    res.live_data = {};
                }
            }else{
                res.live_data = {};
            }
            let baike_data_res:any = await utils.getAsyncRequest(`${config['server_url_eight']}/export/api/zhubo`,{
                platID:live_pid,
                roomID:room_id
            });
            let baike_data_ret = JSON.parse(baike_data_res);
            if(baike_data_ret.code == 200){
                res.baike_data = baike_data_ret.data;
            }
            let video_basic_data_res:any = await utils.getAsyncRequest(`${config['server_url_four']}/api/v1/shortvideo/author/detail/get`,{
                platId:video_pid,
                roomId:room_id
            });
            let video_basic_data_ret = JSON.parse(video_basic_data_res);
            let video_basic_data = {};
            if(video_basic_data_ret.code == 0 && !utils.empty(video_basic_data_ret.data)){
                video_basic_data = video_basic_data_ret.data;
            }
            res.video_basic_data = video_basic_data;
            let video_count_data_res:any = await utils.getAsyncRequest(`${config['server_url_four']}/api/v1/shortvideo/author/xhlscore/get`,{
                platId:video_pid,
                roomId:room_id
            });
            let video_count_data_ret = JSON.parse(video_count_data_res);
            let video_count_data = {};
            if(video_count_data_ret.code == 0 && !utils.empty(video_count_data_ret.data)){
                video_count_data = video_count_data_ret.data;
            }
            res.video_count_data = video_count_data;
        } catch (error) {
            console.log(error);
        }finally{
            return res;
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
                roomId:roomid,
                limit:limit
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
                            video_create_time:(data[i].video_create_time==null||data[i].video_create_time=='')?'':sd.format(data[i].video_create_time*1000, 'YYYY-MM-DD'),
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
                    //TODO 以下数据处理逻辑未编写
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
                total_viewer_sum:!utils.empty(data.totalViewerSum)?data.totalViewerSum:0,
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
    function live_goods_processor(live_goods_list:any, trend:boolean = false){
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
                    if(trend){
                        data_list[live_goods_list[i].live_id].trend = live_record_trend_order_price(live_goods_list[i].min_price, live_goods_list[i].sales_number_trend, data_list[live_goods_list[i].live_id].trend);
                    }
                }else{
                    data_list[live_goods_list[i].live_id] = {
                        total_income:total_income,
                        order_num:order_num,
                        product_id:live_goods_list[i].product_id
                    }
                    if(trend){
                        data_list[live_goods_list[i].live_id].trend = live_record_trend_order_price(live_goods_list[i].min_price, live_goods_list[i].sales_number_trend);
                    }
                }
                data_list[live_goods_list[i].live_id].total_income = parseFloat(data_list[live_goods_list[i].live_id].total_income.toFixed(2));
            }
        }
        return data_list;
    }
    function live_record_trend_order_price(min_price:number, sales_number_trend:any, basic_data:any = {}){
        min_price = min_price/100;
        sales_number_trend = JSON.parse(sales_number_trend);
        let sales_price:any = {};
        let sales_number:any = {};
        if(!utils.empty(basic_data)){
            sales_price = !utils.empty(basic_data.sales_price)?basic_data.sales_price:[];
            sales_number = !utils.empty(basic_data.sales_number)?basic_data.sales_number:[];
        }
        if(!utils.empty(sales_number_trend)){
            for(let i = 0; i < sales_number_trend.length; i++){
                if(sales_number_trend[i].value){
                    continue;
                }
                let time = sd.format(sales_number_trend[i].time, 'YYYY-MM-DD HH:mm');
                if(sales_price[time] != undefined){
                    sales_number[time].value = parseFloat((sales_number[time].value+sales_number_trend[i].value).toFixed(2));
                    sales_price[time].value = parseFloat((sales_price[time].value+(sales_number_trend[i].value * min_price)).toFixed(2));
                }else{
                    sales_number[time] = {
                        time:time,
                        value:sales_number_trend[i].value
                    };
                    sales_price[time] = {
                        time:time,
                        value:sales_number_trend[i].value * min_price
                    };
                }
            }
        }
        return {
            sales_price:sales_price,
            sales_number:sales_number
        }
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
            data.line = {};
            let xiaohulu_index = (time_param.current.start_time == time_param.current.end_time)?[]:await getXiaoHuLuIndex(platform, roomid, time_param.current.start_time, time_param.current.end_time)
            if(!utils.empty(_updateMsgLineData)){
                data.line = _updateMsgLineData(xiaohulu_index);
            }
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

    function _updateMsgLineData(xiaohulu_index:any){
        let follow = [];
        let max_view = [];
        let airtime = [];
        for(let i = 0; i < xiaohulu_index.length; i++){
            follow.push({
                value:xiaohulu_index[i].followNumber,
                time:sd.format(xiaohulu_index[i].date, 'MM-DD')
            });
            max_view.push({
                value:xiaohulu_index[i].maxViewCount,
                time:sd.format(xiaohulu_index[i].date, 'MM-DD'),
            });
            airtime.push({
                value:xiaohulu_index[i].airtime,
                time:sd.format(xiaohulu_index[i].date, 'MM-DD'),
            });
        }

        return {
            follow:follow,
            max_view:max_view,
            airtime:airtime
        };
    }

    async function getXiaoHuLuIndex(platform:number, roomid:string, start:string, end:string){
        let list:any = [];
        try {
            let indexRes:any = await utils.getAsyncRequest(`${config['server_url_one']}/getXiaoHuLuIndex`,{
                platID:platform,
                roomID:roomid,
                startDate:start,
                endDate:end
            });
            let indexRet = JSON.parse(indexRes);
            if(!utils.empty(indexRet)){
                list = indexRet;
            }
        } catch (error) {
            console.log(error);
        }finally{
            return list;
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
                let d = new Date(end).getDay();
                params['endDate'] = sd.format(+new Date(end)-24*60*60*1000*d, 'YYYY-MM-DD');
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
                                    location_name = location_name.replace(/省/g,'');
                                    location_name = location_name.replace(/自治区/g,'');
                                    location_name = location_name.replace(/回族/g,'');
                                    location_name = location_name.replace(/壮族/g,'');
                                    location_name = location_name.replace(/维吾尔/g,'');
                                    location_name = location_name.replace(/特别行政区/g,'');
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
    /**
     * 【带货直播分析】抖音电商数据概览
     * @param request 
     * @param microtime 
     */
    export async function dyshop_overview(request:any, microtime:number){
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
            let current_data:any;
            let previous_data:any;
            let data_detail:any;
            let time_param = timeParamFormatTransform(time_type, time);
            if(time_type == constants.TIME_TYPE_RECENT_TIME && utils.in_array(time, [constants.TIME_TYPE_RECENT_7, constants.TIME_TYPE_RECENT_30])){
                let type = 7;
                if(time == constants.TIME_TYPE_RECENT_30){
                    type = 30;
                }
                let current_res:any = await utils.getAsyncRequest(`${config['server_url_ten']}/getAnchorWeekMonthSaleInfoByPlatRoomDate`,{
                    platIDRoomID:`${platform},${roomid}`,
                    dayCount:type,
                    date:time_param.current.end_time
                });
                let previous_res:any = await utils.getAsyncRequest(`${config['server_url_ten']}/getAnchorWeekMonthSaleInfoByPlatRoomDate`,{
                    platIDRoomID:`${platform},${roomid}`,
                    dayCount:type,
                    date:time_param.previous.end_time
                });
                let data_detail_res:any = await utils.getAsyncRequest(`${config['server_url_ten']}/getAnchorSaleInfoByPlatRoomDate`,{
                    platID:platform,
                    roomID:roomid,
                    startDate:time_param.current.start_time,
                    endDate:time_param.current.end_time
                });
                
                current_data = dyshop_overview_data_processor(JSON.parse(current_res).data);
                previous_data = dyshop_overview_data_processor(JSON.parse(previous_res).data);
                data_detail = dyshop_data_detail_processor(JSON.parse(data_detail_res).data, constants.TIME_TYPE_RECENT_TIME);
            }else{
                let current_res:any = await utils.getAsyncRequest(`${config['server_url_ten']}/getAnchorSaleInfoByPlatRoomDate`,{
                    platID:platform,
                    roomID:roomid,
                    startDate:time_param.current.start_time,
                    endDate:time_param.current.end_time
                });
                let previous_res:any = await utils.getAsyncRequest(`${config['server_url_ten']}/getAnchorSaleInfoByPlatRoomDate`,{
                    platID:platform,
                    roomID:roomid,
                    startDate:time_param.previous.start_time,
                    endDate:time_param.previous.end_time
                });
                
                current_data = dyshop_single_overview_data_processor(JSON.parse(current_res).data);
                previous_data = dyshop_single_overview_data_processor(JSON.parse(previous_res).data);
                data_detail = dyshop_data_detail_processor(JSON.parse(current_res).data, constants.TIME_TYPE_DAY);
            }

            current_data.compare_goods_num = current_data.goods_num - previous_data.goods_num;
            current_data.compare_order_num = current_data.order_num - previous_data.order_num;
            current_data.compare_total_income = current_data.total_income - previous_data.total_income;

            response.overview_data = current_data;
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
    function dyshop_single_overview_data_processor(data:any){
        if(!utils.empty(data)){
            return {
                goods_num:!utils.empty(data[0].goods_num)?data[0].goods_num:0,
                order_num:!utils.empty(data[0].sales_number_add_sum)?data[0].sales_number_add_sum:0,
                total_income:!utils.empty(data[0].sales_price_add)?(data[0].sales_price_add/100):0,
                update_time:(!utils.empty(data[0].update_time)?sd.format(data[0].update_time, 'YYYY-MM-DD HH:mm:ss'):'')
            }
        }else{
            return {
                goods_num:0,
                order_num:0,
                total_income:0,
                update_time:''
            }
        }
    }

    function dyshop_overview_data_processor(data:any){
        let goods_num = 0;
        let order_num = 0;
        let total_income = 0;
        let update_time = '';
        if(!utils.empty(data)){
            for(let i = 0; i < data.length; i++){
                goods_num += (!utils.empty(data[i].goods_num)?data[i].goods_num:0);
                order_num += (!utils.empty(data[i].sales_number_add_sum)?data[i].sales_number_add_sum:0);
                total_income += (!utils.empty(data[i].sales_price_add)?data[i].sales_price_add:0);
                update_time = (!utils.empty(data[i].update_time)?sd.format(data[i].update_time, 'YYYY-MM-DD HH:mm:ss'):'');
            }
        }
        return {
            goods_num:goods_num,
            order_num:order_num,
            total_income:total_income,
            update_time:update_time
        };
    }
    function dyshop_data_detail_processor(data_info:any, time_type:string){
        let sales_price:any = [];
        let sales_number:any = [];
        if(!utils.empty(data_info)){
            if(time_type == constants.TIME_TYPE_DAY){
                sales_price = !utils.empty(data_info[0].sales_price_trend)?JSON.parse(data_info[0].sales_price_trend):[];
                sales_number = !utils.empty(data_info[0].sales_number_trend)?JSON.parse(data_info[0].sales_number_trend):[];

                sales_price = dyshop_data_detail_processor_branch(sales_price, 'sales_price');
                sales_number = dyshop_data_detail_processor_branch(sales_number, 'sales_number');
            }else{
                for(let i = 0; i < data_info.length; i++){
                    if(!utils.empty(data_info[i].statistics_date) && !utils.empty(data_info[i].sales_price_add)){
                        sales_price.push({
                            time:data_info[i].statistics_date,
                            value:data_info[i].sales_price_add
                        });
                    }
                    if(!utils.empty(data_info[i].statistics_date) && !utils.empty(data_info[i].sales_number_add_sum)){
                        sales_number.push({
                            time:data_info[i].statistics_date,
                            value:data_info[i].sales_number_add_sum
                        });
                    }
                }
            }
        }
        return {
            sales_price:sales_price,
            sales_number:sales_number
        }
    }

    function dyshop_data_detail_processor_branch(data_list:any, type:string = 'sales_price'){
        let list = [];
        if(!utils.empty(data_list)){
            for(let i = 0; i < data_list.length; i++){
                let temp = 0;
                if(type == 'sales_price'){
                    temp = data_list[i].value / 100;
                }else{
                    temp = data_list[i].value;
                }
                if(temp > 0){
                    list.push({
                        time:sd.format(data_list[i].time, 'HH:mm'),
                        value:temp
                    })
                }
                data_list[i].time = sd.format(new Date(data_list[i].time*1000), 'HH:mm');
            }
        }
        return data_list;
    }

    export async function live_list(request:any, microtime:number){
        let query = null;
        let method = request.method;
        let route = request.path;
        let paramsCode = '';
        let response:any = {
            live_list:[],
            average:[],
            lastest_live_info:{},
            time:{}
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
            let average = true;// bool  true 获取30天 场次总览 与 均值 false 获取单日场次列表信息
            let is_shopping = 1;
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
            let time_param = timeParamFormatTransform(time_type, time);
            let live_goods_info:any;
            let average_list = [];
            let lastest_live_info_res:any;
            let liveRes:any = await utils.getAsyncRequest(`${config['server_url_ten']}/getAnchorLiveInfoAndBase`,{
                platID:platform,
                roomID:roomid,
                startTime:`${time_param.current.start_time} 00:00:00`,
                endTime:`${time_param.current.end_time} 23:59:59`,
                limitCount:100,
                is_shopping:is_shopping
            });

            let liveRet = JSON.parse(liveRes);
            if(liveRet.code == 1 && !utils.empty(liveRet.data)){
                let data = liveRet.data;
                // if(time_type == constants.TIME_TYPE_DAY){

                // }
                let live_ids = [];
                for(let i = 0; i < data.length; i++){
                    live_ids.push(data[i].live_id);
                }
                let liveRecordGoodsListRes:any = await utils.getAsyncRequest(`${config['server_url_ten']}/getAnchorGoodsSaleInfoByPlatRoomLive`,{
                    platID:platform,
                    roomID:roomid,
                    liveID:live_ids.join(',')
                });
                let liveRecordGoodsListRet = JSON.parse(liveRecordGoodsListRes);
                live_goods_info = liveRecordGoodsListRet.data;
                let live_list_goods_info = live_goods_processor(live_goods_info, average);
                let lastest_live_id = live_ids[0];
                lastest_live_info_res = await utils.getAsyncRequest(`${config['server_url_ten']}/getAnchorLiveInfoByAnchorAndLiveId`,{
                    platID:platform,
                    roomID:roomid,
                    liveID:lastest_live_id
                });
                let liveList = live_record_data_processor(data, live_list_goods_info);
                if(average){
                    average_list = get_live_list_average(liveList);
                }
                for(let i = 0; i < liveList.length; i++){
                    if(platform == constants.LIVE_KUAISHOU_PLAT_ID){
                        let ks_live_info_res:any = await utils.getAsyncRequest(`${config['server_url_five']}/getSchedulerByTaskID`,{
                            taskID:liveList[i].live_id
                        });
                        let ks_live_info_ret = JSON.parse(ks_live_info_res);
                        if(ks_live_info_ret.code == 1 && !utils.empty(ks_live_info_ret)){
                            let ks_live_info_data = ks_live_info_ret.data;
                            if(!utils.empty(ks_live_info_data.live_pic_url)){
                                liveList[i].live_img = ks_live_info_data.live_pic_url;
                            }
                            if(!utils.empty(ks_live_info_data.title)){
                                liveList[i].title = ks_live_info_data.title;
                            }
                            if(!utils.empty(ks_live_info_data.charge_gift_price)){
                                liveList[i].virtual_coin = ks_live_info_data.charge_gift_price;
                            }
                            if(!utils.empty(ks_live_info_data.charge_gift_sender)){
                                liveList[i].tycoon_count_sum = ks_live_info_data.charge_gift_sender;
                            }
                        }
                    }
                    if(utils.empty(average)){
                        let live_info_res:any = await utils.getAsyncRequest(`${config['server_url_ten']}/getAnchorLiveInfoByAnchorAndLiveId`,{
                            platID:platform,
                            roomID:roomid,
                            liveID:liveList[i].live_id
                        });
                        let live_info_ret = JSON.parse(live_info_res);
                        if(!utils.empty(live_info_ret.totalViewerTrend)){
                            let total_viewer = JSON.parse(live_info_ret.totalViewerTrend);
                            liveList[i].total_viewer = data_detail_processor_branch(total_viewer, 'total_viewer');
                        }
                        liveList[i].live_source_link = !utils.empty(live_info_ret.live_source_link)?live_info_ret.live_source_link:''
                    }
                }
                response.live_list = liveList;
                response.average = average_list;
                response.lastest_live_info = JSON.parse(lastest_live_info_res);
                response.time = time_param.current;
            }
            await redisHelper.setex(`${redisHelper.P_DATA_POOL}${paramsCode}`, redisHelper._expire_t, JSON.stringify(response));
            return utils.responseCommon(results['SUCCESS'], response, {
                microtime:microtime,
                path:route,
                resTime:utils.microtime()
            });
        }catch(e){
            console.log(e);
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
    function get_live_list_average(list:any){
        let average:any = {};
        let total_viewer_sum = 0;
        let order_num = 0;
        let total_income = 0;
        let new_fans_num = 0;
        let num = 0;
        if(!utils.empty(list)){
            for(let i = 0; i < list.length; i++){
                let start_time = !utils.empty(list[i].start_time)?utils.tomest(list[i].start_time):0;
                let end_time = !utils.empty(list[i].end_time)?utils.tomest(list[i].end_time):0;
                if(!utils.empty(list[i].total_income) && (end_time-start_time) > 30 *60){
                    total_viewer_sum += list[i].total_viewer_sum;
                    order_num += list[i].order_num;
                    total_income += list[i].total_income;
                    new_fans_num += list[i].new_fans_num;
                    num++;
                }
            }
            if(num != 0){
                average = {
                    total_viewer_sum:parseFloat((total_viewer_sum/num).toFixed(2)),
                    order_num:parseFloat((order_num/num).toFixed(2)),
                    total_income:parseFloat((total_income/num).toFixed(2)),
                    new_fans_num:parseFloat((new_fans_num/num).toFixed(2)),
                }
                average.price = !utils.empty(order_num)?parseFloat((average.total_income/average.order_num).toFixed(2)):0
            }
        }
        return average;
    }
    
    export async function goods_list(request:any, microtime:number){
        let query = null;
        let method = request.method;
        let route = request.path;
        let paramsCode = '';
        let response:any = {
            data:[],
            total:0,
            current_page:1,
            last_page:1
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
            let price = query.price;
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
            paramsCode = md5(`${route}|${platform}|${roomid}|${time_type}|${time}|${price}|${page}|${limit}`);

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
            let time_param = timeParamFormatTransform(time_type, time);
            let rank_type = constants.TIME_TYPE_DAY;
            if(time_type == constants.TIME_TYPE_RECENT_TIME && utils.in_array(time, [constants.TIME_TYPE_RECENT_7, constants.TIME_TYPE_RECENT_30])){
                let type = 7;
                if(time == constants.TIME_TYPE_RECENT_30){
                    type = 30;
                }
                let goods_list_res:any = await utils.getAsyncRequest(`${config['server_url_ten']}/getAnchorGoodsWeeekMonthInfoByPlatRoomDate`,{
                    platID:platform,
                    roomID:roomid,
                    date:sd.format(+new Date()-24*60*60*1000, 'YYYY-MM-DD'),
                    dayCount:type
                });
                let goods_list_ret = JSON.parse(goods_list_res);
                let goods_list = !utils.empty(goods_list_ret.data)?goods_list_ret.data:[];
                rank_type = constants.TIME_TYPE_DAY
                if(!utils.empty(goods_list)){
                    response.data = await live_goods_list_detail_product_id(goods_list, constants.SOURCE_DETAIL, rank_type,price);
                }
            }else{
                let goods_list_res:any = await utils.getAsyncRequest(`${config['server_url_ten']}/getAnchorGoodsSaleInfoByPlatRoomDate`,{
                    platID:platform,
                    roomID:roomid,
                    startDate:time_param.current.start_time,
                    endDate:time_param.current.end_time
                });
                let goods_list_ret = JSON.parse(goods_list_res);
                let goods_list = !utils.empty(goods_list_ret.data)?goods_list_ret.data:[];
                if(!utils.empty(goods_list)){
                    response.data = await live_goods_list_detail(goods_list, constants.SOURCE_DETAIL, rank_type,price);
                }
            }
            response.total = utils.defaultVal(response.data, response.data.length, 0);
            let start = (page-1)*limit;
            response.last_page = Math.ceil(response.total/limit);
            response.current_page = page;
            response.data = response.data.slice(start, start+limit);

            await redisHelper.setex(`${redisHelper.P_DATA_POOL}${paramsCode}`, redisHelper._expire_t, JSON.stringify(response));
            return utils.responseCommon(results['SUCCESS'], response, {
                microtime:microtime,
                path:route,
                resTime:utils.microtime()
            });
        }catch(e){
            console.log(e);
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
    
    export async function goods_recent30_brand_info(request:any, microtime:number){
        let query = null;
        let method = request.method;
        let route = request.path;
        let paramsCode = '';
        let isRecordCache = true;
        let response:any = {
        };
        try{
            if(method == 'get'){
                query = request.query;
            }else if(method == 'post'){
                query = request.payload;
            }
            let platform = query.platform;
            let roomid = query.roomid;
            let price = query.price;
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
            paramsCode = md5(`${route}|${platform}|${roomid}|${price}|${page}|${limit}`);

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

            let res:any = await utils.getAsyncRequest(`${config['core_host']}/apis/dianshang/anchor/sales_info`,{
                platform_id:platform,
                room_id:roomid
            },{
                'app-id':config['core_appid'],
                'app-secret':config['core_appsecret']
            })

            let ret = JSON.parse(res);
            if(ret.code == 100 && !utils.empty(ret.data)){
                let data = ret.data;
                if(data == 'waitting'){
                    isRecordCache = false;
                    response.status = 'waitting';
                }else{
                    response = data;
                }
            }
            if(isRecordCache){
                await redisHelper.setex(`${redisHelper.P_DATA_POOL}${paramsCode}`, redisHelper._expire_t, JSON.stringify(response));
            }
            return utils.responseCommon(results['SUCCESS'], response, {
                microtime:microtime,
                path:route,
                resTime:utils.microtime()
            });
        }catch(e){
            console.log(e);
            if(isRecordCache){
                await redisHelper.setex(`${redisHelper.P_DATA_POOL}${paramsCode}`, redisHelper._expire_short_t, JSON.stringify(response));
            }
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
    export async function goods_list_recent30(request:any, microtime:number){
        let query = null;
        let method = request.method;
        let route = request.path;
        let paramsCode = '';
        let response:any = {
            data:[],
            total:0,
            current_page:1,
            last_page:1
        };
        try{
            if(method == 'get'){
                query = request.query;
            }else if(method == 'post'){
                query = request.payload;
            }
            let platform = query.platform;
            let roomid = query.roomid;
            let price = query.price;
            let brand_name = query.brand_name;
            let tag_name = query.tag_name;
            let plat_label = query.plat_label;
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
            paramsCode = md5(`${route}|${platform}|${roomid}|${price}|${brand_name}|${tag_name}|${plat_label}|${page}|${limit}`);

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

            let params:any = {
                platform_id:platform,
                room_id:roomid,
                page:page,
                limit:limit,
            };

            if(!utils.empty(price)){
                let priceStr = '';
                let priceAry:any = price.split('-');
                if(priceAry[1] != 0){
                    priceStr = `${priceAry[0]},${priceAry[1]}`;
                }else{
                    priceStr = `${priceAry[0]}`;
                }
                params['min_price'] = priceStr;
            }
            if(!utils.empty(brand_name)){
                params['brand_name'] = encodeURI(brand_name);
            }
            if(!utils.empty(tag_name)){
                params['tag_name'] = encodeURI(tag_name);
            }
            if(!utils.empty(plat_label)){
                params['plat_label'] = encodeURI(plat_label);
            }

            let res:any = await utils.getAsyncRequest(`${config['core_host']}/apis/dianshang/anchor/sales_goods_list`,params,{
                'app-id':config['core_appid'],
                'app-secret':config['core_appsecret']
            })
            let ret = JSON.parse(res);
            if(ret.code == 100 && !utils.empty(ret.data)){
                let data = ret.data;
                response = data;
            }

            // await redisHelper.setex(`${redisHelper.P_DATA_POOL}${paramsCode}`, redisHelper._expire_t, JSON.stringify(response));
            return utils.responseCommon(results['SUCCESS'], response, {
                microtime:microtime,
                path:route,
                resTime:utils.microtime()
            });
        }catch(e){
            console.log(e);
            // await redisHelper.setex(`${redisHelper.P_DATA_POOL}${paramsCode}`, redisHelper._expire_short_t, JSON.stringify(response));
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
    async function live_goods_list_detail(data_list:any, source:string = constants.SOURCE_LIST, time_type:string = constants.TIME_TYPE_DAY,price:string){
        let list:any = [];
        try {
            if(!utils.empty(data_list)){
                data_list = data_list.slice(0, 300);
                let tempList = [];
                for(let i = 0; i < data_list.length; i++){
                    if(!utils.empty(data_list[i].platform_id) && !utils.empty(data_list[i].promotion_id)){
                        data_list[i]['plat_goods_id_comma'] = `${data_list[i].platform_id},${data_list[i].promotion_id}`;
                        tempList.push(`${data_list[i].platform_id},${data_list[i].product_id}`);
                    }else{
                        data_list[i]['plat_goods_id_comma'] = '';
                    }
                }
                let plat_goods_id_comm = tempList.join('_');
                let goods_list_detail_res:any = await utils.getAsyncRequest(`${config['server_url_ten']}/getGoodsBaseInfoByPlatPromotionIDS`,{
                    platID_productIDS:plat_goods_id_comm
                });
                let goods_list_detail_ret = JSON.parse(goods_list_detail_res);
                let data = goods_list_detail_ret.data;
                let goods_list_detail:any = {};
                for(let i = 0; i < data.length; i++){
                    goods_list_detail[data[i].promotion_id] = data[i];
                }
                let priceAry:any = [];
                if(!utils.empty(price)){
                    priceAry = price.split('-');
                }
                for(let i = 0; i < data_list.length; i++){
                    if(!utils.empty(priceAry)){
                        let headVal = parseInt(priceAry[0]);
                        let tailVal = parseInt(priceAry[1]);
                        let mini_price = utils.defaultVal(data_list[i].min_price, parseFloat((data_list[i].min_price/100).toFixed(2)), 0);
                        if(tailVal == 0){
                            if(mini_price < headVal){
                                continue;
                            }
                        }else if(headVal == 0){
                            if(mini_price > tailVal){
                                continue;
                            }
                        }else{
                            if(headVal > tailVal){
                                if(mini_price >= tailVal && mini_price <= headVal){
    
                                }else{
                                    continue;
                                }
                            }else{
                                if(mini_price >= headVal && mini_price <= tailVal){
    
                                }else{
                                    continue;
                                }
                            }
                        }
                    }
                    if(!utils.empty(goods_list_detail[data_list[i].promotion_id])){
                        data_list[i].goods_image = !utils.empty(goods_list_detail[data_list[i].promotion_id].cover)?goods_list_detail[data_list[i].promotion_id].cover:'';
                        data_list[i].short_title = utils.empty(data_list[i].short_title)?goods_list_detail[data_list[i].promotion_id].short_title:data_list[i].short_title;
                        data_list[i].title = utils.empty(data_list[i].title)?goods_list_detail[data_list[i].promotion_id].title:data_list[i].title;
                        data_list[i].coupon = !utils.empty(goods_list_detail[data_list[i].promotion_id].coupon)?goods_list_detail[data_list[i].promotion_id].coupon:'';
                        data_list[i].seckill_min_price = !utils.empty(goods_list_detail[data_list[i].promotion_id].seckill_min_price)?goods_list_detail[data_list[i].promotion_id].seckill_min_price:'';
                        data_list[i].detail_url = utils.defaultVal(data_list[i].detail_url,data_list[i].detail_url,utils.defaultVal(goods_list_detail[data_list[i].promotion_id].detail_url,goods_list_detail[data_list[i].promotion_id].detail_url,''));
                    }
                    data_list[i] = goods_list_processor(data_list[i], source, time_type);
                    list.push(data_list[i]);
                }
            }
            return list;
        } catch (error) {
            console.log(error);
        }finally{
            return list;
        }
    }

    async function live_goods_list_detail_product_id(data_list:any, source:string = constants.SOURCE_LIST, time_type:string = constants.TIME_TYPE_DAY,price:string){
        let list:any = [];
        try {
            if(!utils.empty(data_list)){
                data_list = data_list.slice(0, 300);
                let tempList = [];
                for(let i = 0; i < data_list.length; i++){
                    if(!utils.empty(data_list[i].platform_id) && !utils.empty(data_list[i].product_id)){
                        data_list[i]['plat_goods_id_comma'] = `${data_list[i].platform_id},${data_list[i].product_id}`;
                        tempList.push(`${data_list[i].platform_id},${data_list[i].product_id}`);
                    }else{
                        data_list[i]['plat_goods_id_comma'] = '';
                    }
                }
                let plat_goods_id_comm = tempList.join('_');
                let goods_list_detail_res:any = await utils.getAsyncRequest(`${config['server_url_ten']}/getGoodsBaseInfoByPlatPromotionIDS`,{
                    platID_productIDS:plat_goods_id_comm
                });
                let goods_list_detail_ret = JSON.parse(goods_list_detail_res);
                let data = goods_list_detail_ret.data;
                let goods_list_detail:any = {};
                for(let i = 0; i < data.length; i++){
                    goods_list_detail[data[i].product_id] = data[i];
                }
                let priceAry:any = [];
                if(!utils.empty(price)){
                    priceAry = price.split('-');
                }
                for(let i = 0; i < data_list.length; i++){
                    if(!utils.empty(priceAry)){
                        let headVal = parseInt(priceAry[0]);
                        let tailVal = parseInt(priceAry[1]);
                        let mini_price = utils.defaultVal(data_list[i].min_price, parseFloat((data_list[i].min_price/100).toFixed(2)), 0);
                        if(tailVal == 0){
                            if(mini_price < headVal){
                                continue;
                            }
                        }else if(headVal == 0){
                            if(mini_price > tailVal){
                                continue;
                            }
                        }else{
                            if(headVal > tailVal){
                                if(mini_price >= tailVal && mini_price <= headVal){
    
                                }else{
                                    continue;
                                }
                            }else{
                                if(mini_price >= headVal && mini_price <= tailVal){
    
                                }else{
                                    continue;
                                }
                            }
                        }
                    }
                    if(!utils.empty(goods_list_detail[data_list[i].product_id])){
                        data_list[i].goods_image = !utils.empty(goods_list_detail[data_list[i].product_id].cover)?goods_list_detail[data_list[i].product_id].cover:'';
                        data_list[i].short_title = utils.empty(data_list[i].short_title)?goods_list_detail[data_list[i].product_id].short_title:data_list[i].short_title;
                        data_list[i].title = utils.empty(data_list[i].title)?goods_list_detail[data_list[i].product_id].title:data_list[i].title;
                        data_list[i].coupon = !utils.empty(goods_list_detail[data_list[i].product_id].coupon)?goods_list_detail[data_list[i].product_id].coupon:'';
                        data_list[i].seckill_min_price = !utils.empty(goods_list_detail[data_list[i].product_id].seckill_min_price)?goods_list_detail[data_list[i].product_id].seckill_min_price:'';
                    }
                    data_list[i] = goods_list_processor(data_list[i], source, time_type);
                    list.push(data_list[i]);
                }
            }
            return list;
        } catch (error) {
            console.log(error);
        }finally{
            return list;
        }
    }
    function goods_list_processor(data:any, source:string = constants.SOURCE_LIST, time_type:string = constants.TIME_TYPE_DAY){
        let source_id_map_name:any = {
            4 : '抖音小店', 5 : '淘宝', 6 : '抖音小店', 7 : '淘宝',
            8 : '京东', 9 : '考拉', 10 : '唯品会', 11 : '苏宁',
            94 : '魔筷', 95 : '有赞', 98 : '闪电购', 99 : '快手小店',
        }
        let goods = {
            goods_id:utils.defaultVal(data.promotion_id, data.promotion_id, ''),
            goods_name:utils.defaultVal(data.short_title, data.short_title, ''),
            goods_image:utils.defaultVal(data.goods_image, data.goods_image, ''),
            title:utils.defaultVal(data.title, data.title, ''),
            platform_id:utils.defaultVal(data.platform_id, data.platform_id, ''),
            product_id:utils.defaultVal(data.product_id, data.product_id, ''),
            price:utils.defaultVal(data.price, parseFloat((data.price/100).toFixed(2)), 0),
            min_price:utils.defaultVal(data.min_price, parseFloat((data.min_price/100).toFixed(2)), 0),
            coupon:utils.defaultVal(data.coupon, parseFloat((data.coupon/100).toFixed(2)), 0),
            seckill_min_price:utils.defaultVal(data.seckill_min_price, parseFloat((data.seckill_min_price/100).toFixed(2)), 0),
            source_id:utils.defaultVal(data.item_type, data.item_type, ''),
            source_name:utils.defaultVal(source_id_map_name[data.item_type], source_id_map_name[data.item_type], ''),
            sales_price_add:0,
            sales_number_add:0,
            update_time:utils.defaultVal(data.update_time, sd.format(data.update_time, 'YYYY-MM-DD HH:mm:ss'), ''),
            sales_time:utils.defaultVal(data.sales_time, data.sales_time, ''),
            detail_url:utils.defaultVal(data.detail_url, data.detail_url, ''),
            statistics_date:utils.defaultVal(data.statistics_date, data.statistics_date, '')
        };
        if(utils.empty(goods.goods_id)){
            goods.goods_id = data.product_id;
        }
        switch(source){
            case constants.SOURCE_DETAIL:
                goods.sales_number_add = utils.defaultVal(data.sales_number_add,data.sales_number_add,0);
                if(utils.in_array(time_type, [constants.TIME_TYPE_WEEK, constants.TIME_TYPE_MONTH])){
                    goods.sales_price_add = utils.defaultVal(data.sales_price_sum_add,data.sales_price_sum_add/100,0);
                }else{
                    if(!utils.empty(goods.sales_number_add) && !utils.empty(goods.min_price)){
                        goods.sales_price_add = parseFloat((goods.sales_number_add * goods.min_price).toFixed(2));
                    }
                }
                break;
            default:
                goods.sales_number_add = utils.defaultVal(data.sales_number_add_sum,data.sales_number_add_sum,0);
                if(utils.in_array(time_type, [constants.TIME_TYPE_WEEK, constants.TIME_TYPE_MONTH])){
                    goods.sales_price_add = utils.defaultVal(data.sales_price_sum,data.sales_price_sum/100,0);
                }else{
                    if(!utils.empty(goods.sales_number_add) && !utils.empty(goods.min_price)){
                        goods.sales_price_add = parseFloat((goods.sales_number_add * goods.min_price).toFixed(2));
                    }
                }
                break;
        }
        return goods;
    }
    /**
     * 通过红人获取公会信息（批量）
     * @param request 
     * @param microtime 
     */
    export async function get_guild_info_by_anchor(request:any, microtime:number){
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
            let res:any = await utils.getAsyncRequest(`${config['core_host']}/apis/core-data/api/v1/coreguildByAnchor`,{
                batch_pid_rid:batch_pid_rid
            },{
                'app-id':config['core_appid'],
                'app-secret':config['core_appsecret']
            })
            let ret = JSON.parse(res);
            if(ret.status == 200 && !utils.empty(ret.data)){
                let data = ret.data;
                response = data;
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
     * 通过红人获取公会详细信息
     * @param request 
     * @param microtime 
     */
    export async function get_guild_detail_info_by_anchor(request:any, microtime:number){
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
            let pid = query.pid;
            let rid = query.rid;
            paramsCode = md5(`${route}|${pid}|${rid}`);

            let cacheRes:any = await redisHelper.get(`${redisHelper.P_DATA_POOL}${paramsCode}`);
            if(!utils.empty(cacheRes)){
                return utils.responseCommon(results['SUCCESS'], JSON.parse(cacheRes), {
                    microtime:microtime,
                    path:route,
                    resTime:utils.microtime()
                });
            }
            let res:any = await utils.getAsyncRequest(`${config['core_host']}/apis/core-data/api/v1/coreguild/by/${pid}/${rid}`,null,{
                'app-id':config['core_appid'],
                'app-secret':config['core_appsecret']
            })
            let ret = JSON.parse(res);
            if(ret.status == 200 && !utils.empty(ret.data)){
                let data = ret.data;
                response = data;
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

    export async function sales_anchors_by_goods(request:any, microtime:number){
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
            let plat_type = query.plat_type;
            let tags = query.tags;
            let avg_live_sale = query.avg_live_sale;
            let avg_live_order = query.avg_live_order;
            let single_live_agv_order = query.single_live_agv_order;
            let single_live_agv_sale = query.single_live_agv_sale;
            let goods_agv_sale = query.goods_agv_sale;
            let live_count = query.live_count;
            let fans_count = query.fans_count;
            let live_online_count = query.live_online_count;
            let sort_by = query.sort_by;
            let sort_type = query.sort_type;
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
            paramsCode = md5(`${route}|${plat_type}|${tags}|${avg_live_sale}|${avg_live_order}|${single_live_agv_order}|${single_live_agv_sale}|${goods_agv_sale}|${live_count}|${fans_count}|${live_online_count}|${sort_by}|${sort_type}|${page}|${limit}`);

            let cacheRes:any = await redisHelper.get(`${redisHelper.P_DATA_POOL}${paramsCode}`);
            if(!utils.empty(cacheRes)){
                return utils.responseCommon(results['SUCCESS'], JSON.parse(cacheRes), {
                    microtime:microtime,
                    path:route,
                    resTime:utils.microtime()
                });
            }
            let params:any = {};
            let platIDs = ``;
            if(!utils.empty(plat_type)){
                if(plat_type == constants.VIDEO_DOUYIN_PLAT_ID){
                    platIDs = `${constants.LIVE_DOUYIN_PLAT_ID}`;
                }else if(plat_type == constants.VIDEO_KUAISHOU_PLAT_ID){
                    platIDs = `${constants.LIVE_KUAISHOU_PLAT_ID}`;
                }
            }else{
                platIDs = `${constants.LIVE_DOUYIN_PLAT_ID},${constants.LIVE_KUAISHOU_PLAT_ID}`;
            }
            params.platIDs = platIDs;
            if(!utils.empty(tags)){
                params.tag_ali_id = tags;
            }
            if(!utils.empty(avg_live_sale)){
                params.avg_live_sales_price = avg_live_sale;
            }
            if(!utils.empty(avg_live_order)){
                params.avg_live_sales_num = avg_live_order;
            }
            if(!utils.empty(single_live_agv_order)){
                let tempAry = single_live_agv_order.split('-');
                if(tempAry[1] == 0){
                    params.sign_live_agv_sales_num_min = tempAry[0];
                }else{
                    params.sign_live_agv_sales_num_min = tempAry[0];
                    params.sign_live_agv_sales_num_max = tempAry[1];
                }
            }
            if(!utils.empty(single_live_agv_sale)){
                let tempAry = single_live_agv_sale.split('-');
                if(tempAry[1] == 0){
                    params.sign_live_agv_price_min = tempAry[0];
                }else{
                    params.sign_live_agv_price_min = tempAry[0];
                    params.sign_live_agv_price_max = tempAry[1];
                }
            }
            if(!utils.empty(goods_agv_sale)){
                let tempAry = goods_agv_sale.split('-');
                if(tempAry[1] == 0){
                    params.prod_agv_price_min = tempAry[0];
                }else{
                    params.prod_agv_price_min = tempAry[0];
                    params.prod_agv_price_max = tempAry[1];
                }
            }
            if(!utils.empty(live_count)){
                let tempAry = live_count.split('-');
                if(tempAry[1] == 0){
                    params.live_count_min = tempAry[0];
                }else{
                    params.live_count_min = tempAry[0];
                    params.live_count_max = tempAry[1];
                }
            }
            if(!utils.empty(fans_count)){
                let tempAry = fans_count.split('-');
                if(tempAry[1] == 0){
                    params.fans_count_min = tempAry[0];
                }else{
                    params.fans_count_min = tempAry[0];
                    params.fans_count_max = tempAry[1];
                }
            }
            if(!utils.empty(live_online_count)){
                let tempAry = live_online_count.split('-');
                if(tempAry[1] == 0){
                    params.online_viewer_max_min = tempAry[0];
                }else{
                    params.online_viewer_max_min = tempAry[0];
                    params.online_viewer_max_max = tempAry[1];
                }
            }
            params.sortBy = sort_by;
            params.sortType = sort_type;
            params.page = page;
            params.limit = limit;

            let res:any = await utils.getAsyncRequest(`${config['core_host']}/apis/8033/getSalesAnchorsByPar`,params,{
                'app-id':config['core_appid'],
                'app-secret':config['core_appsecret']
            })
            let ret = JSON.parse(res);
            if(!utils.empty(ret)){
                response = ret;
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
    
    export async function sales_anchors_goodat_goods(request:any, microtime:number){
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
            let top_num = query.top_num;
            let plat_Room_sets = query.plat_Room_sets;
            
            paramsCode = md5(`${route}|${plat_Room_sets}|${top_num}`);

            let cacheRes:any = await redisHelper.get(`${redisHelper.P_DATA_POOL}${paramsCode}`);
            if(!utils.empty(cacheRes)){
                return utils.responseCommon(results['SUCCESS'], JSON.parse(cacheRes), {
                    microtime:microtime,
                    path:route,
                    resTime:utils.microtime()
                });
            }
            
            let res:any = await utils.getAsyncRequest(`${config['core_host']}/apis/8033/getMuiltAnchorToptagsByPlatRoomIDSet`,{
                plat_Room_sets:plat_Room_sets,
                topn:top_num
            },{
                'app-id':config['core_appid'],
                'app-secret':config['core_appsecret']
            })
            let ret = JSON.parse(res);
            if(!utils.empty(ret)){
                response = ret;
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
    export async function clear_cache(request:any, microtime:number){
        let query = null;
        let method = request.method;
        let route = request.path;
        try{
            if(method == 'get'){
                query = request.query;
            }else if(method == 'post'){
                query = request.payload;
            }
            let keys = query.keys;

            let keysRes:any = await redisHelper.keys(keys);
            
            if(!utils.empty(keysRes)){
                await redisHelper.del(keysRes);
            }

            return utils.responseCommon(results['SUCCESS'], null, {
                microtime:microtime,
                path:route,
                resTime:utils.microtime()
            });
        }catch(e){
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