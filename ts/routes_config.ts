import Joi from '@hapi/joi';
import { join } from 'path';

export module routes_config{
    export function anchor_base_info(valid:string='payload'){
        let val = Joi.object({
            platform:Joi.number().required().description('平台号'),
            roomid:Joi.string().required().description('房间id'),
        });
        let obj:any = {};
        obj[valid] = val;
        obj.options = {
            allowUnknown: true,
        };
        return {
            description: '红人基础信息',
            notes: 'method:get',
            tags: ['api'],
            validate:obj
        }
    }
    
    export function video_data_summary(valid:string='payload'){
        let val = Joi.object({
            platform:Joi.number().required().description('平台号'),
            roomid:Joi.string().required().description('房间id'),
        });
        let obj:any = {};
        obj[valid] = val;
        obj.options = {
            allowUnknown: true,
        };
        return {
            description: '作品数据概览',
            notes: 'method:get',
            tags: ['api'],
            validate:obj
        }
    }
    
    export function data_trend_line(valid:string='payload'){
        let val = Joi.object({
            platform:Joi.number().required().description('平台号'),
            roomid:Joi.string().required().description('房间id'),
            type:Joi.number().required().default(1).allow([1,2,3]).description('1.评论2.粉丝3.点赞'),
            day:Joi.number().required().default(7).allow([7,30]).description('1.7天2.30天')
        });
        let obj:any = {};
        obj[valid] = val;
        obj.options = {
            allowUnknown: true,
        };
        return {
            description: '数据趋势表现',
            notes: 'method:get',
            tags: ['api'],
            validate:obj
        }
    }
    
    export function video_issue_frequency(valid:string='payload'){
        let val = Joi.object({
            platform:Joi.number().required().description('平台号'),
            roomid:Joi.string().required().description('房间id')
        });
        let obj:any = {};
        obj[valid] = val;
        obj.options = {
            allowUnknown: true,
        };
        return {
            description: '作品发布频率',
            notes: 'method:get',
            tags: ['api'],
            validate:obj
        }
    }
    
    export function video_list(valid:string='payload'){
        let val = Joi.object({
            platform:Joi.number().required().description('平台号'),
            roomid:Joi.string().required().description('房间id'),
            type:Joi.number().required().default(1).allow([1,2]).description('1.热门5.最新'),
            limit:Joi.number().default(9).description('获取数量，最多30')
        });
        let obj:any = {};
        obj[valid] = val;
        obj.options = {
            allowUnknown: true,
        };
        return {
            description: '作品列表',
            notes: 'method:get',
            tags: ['api'],
            validate:obj
        }
    }
    
    export function tycoon_list(valid:string='payload'){
        let val = Joi.object({
            platform:Joi.number().required().description('平台号'),
            roomid:Joi.string().required().description('房间id'),
            time_type:Joi.string().required().allow(['recent_time','day']).description('时间类型：recent_time（代表近日选择）/day（代表日期选择）'),
            time:Joi.string().required().description('【recent_time下选择】：today/yesterday/recent_7/recent_30 【day下选择】：日期格式YYYY-MM-DD,去除今日昨日的往前推8天时间'),
            page:Joi.number().default(1).description('页号'),
            limit:Joi.number().default(10).description('获取数量，每页最多10')
        });
        let obj:any = {};
        obj[valid] = val;
        obj.options = {
            allowUnknown: true,
        };
        return {
            description: '送礼土豪列表(抖音201时调用)',
            notes: 'method:get',
            tags: ['api'],
            validate:obj
        }
    }
    
    export function overview(valid:string='payload'){
        let val = Joi.object({
            platform:Joi.number().required().description('平台号'),
            roomid:Joi.string().required().description('房间id'),
            time_type:Joi.string().required().allow(['recent_time','day']).description('时间类型：recent_time（代表近日选择）/day（代表日期选择）'),
            time:Joi.string().required().description('【recent_time下选择】：today/yesterday/recent_7/recent_30 【day下选择】：日期格式YYYY-MM-DD,去除今日昨日的往前推8天时间'),
            page:Joi.number().default(1).description('页号'),
            limit:Joi.number().default(10).description('获取数量，每页最多10')
        });
        let obj:any = {};
        obj[valid] = val;
        obj.options = {
            allowUnknown: true,
        };
        return {
            description: '数据概览(抖音201时调用)',
            notes: 'method:get',
            tags: ['api'],
            validate:obj
        }
    }
    
    export function anchor_live_record(valid:string='payload'){
        let val = Joi.object({
            platform:Joi.number().required().description('平台号'),
            roomid:Joi.string().required().description('房间id'),
            time_type:Joi.string().required().allow(['recent_time','day']).description('时间类型：recent_time（代表近日选择）/day（代表日期选择）'),
            time:Joi.string().required().description('【recent_time下选择】：today/yesterday/recent_7/recent_30 【day下选择】：日期格式YYYY-MM-DD,去除今日昨日的往前推8天时间'),
            page:Joi.number().default(1).description('页号'),
            limit:Joi.number().default(10).description('获取数量，每页最多10')
        });
        let obj:any = {};
        obj[valid] = val;
        obj.options = {
            allowUnknown: true,
        };
        return {
            description: '获取主播直播记录(快手202时调用)',
            notes: 'method:get',
            tags: ['api'],
            validate:obj
        }
    }
    
    export function anchor_live_comprehensive_data(valid:string='payload'){
        let val = Joi.object({
            platform:Joi.number().required().description('平台号'),
            roomid:Joi.string().required().description('房间id'),
            time_type:Joi.string().required().allow(['recent_time','day']).description('时间类型：recent_time（代表近日选择）/day（代表日期选择）'),
            time:Joi.string().required().description('【recent_time下选择】：today/yesterday/recent_7/recent_30 【day下选择】：日期格式YYYY-MM-DD,去除今日昨日的往前推8天时间'),
        });
        let obj:any = {};
        obj[valid] = val;
        obj.options = {
            allowUnknown: true,
        };
        return {
            description: '主播直播综合数据(快手202时调用)',
            notes: 'method:get',
            tags: ['api'],
            validate:obj
        }
    }
    
    export function portrait(valid:string='payload'){
        let val = Joi.object({
            platform:Joi.number().required().description('平台号'),
            roomid:Joi.string().required().description('房间id'),
            type:Joi.number().required().allow([1,2,3,4,5,6]).description('1.性别分布2.星座分布3.粉丝活跃时间分布-按天4.粉丝活跃时间分布-按周5.年龄分布6.地域分布')
        });
        let obj:any = {};
        obj[valid] = val;
        obj.options = {
            allowUnknown: true,
        };
        return {
            description: '用户画像',
            notes: 'method:get',
            tags: ['api'],
            validate:obj
        }
    }
    
    export function dyshop_overview(valid:string='payload'){
        let val = Joi.object({
            platform:Joi.number().required().description('平台号'),
            roomid:Joi.string().required().description('房间id'),
            time_type:Joi.string().required().allow(['recent_time','day']).description('时间类型：recent_time（代表近日选择）/day（代表日期选择）'),
            time:Joi.string().required().description('【recent_time下选择】：today/yesterday/recent_7/recent_30 【day下选择】：日期格式YYYY-MM-DD,去除今日昨日的往前推8天时间'),
        });
        let obj:any = {};
        obj[valid] = val;
        obj.options = {
            allowUnknown: true,
        };
        return {
            description: '【带货直播分析】电商数据概览',
            notes: 'method:get',
            tags: ['api'],
            validate:obj
        }
    }
    export function live_list(valid:string='payload'){
        let val = Joi.object({
            platform:Joi.number().required().description('平台号'),
            roomid:Joi.string().required().description('房间id'),
            time_type:Joi.string().required().allow(['recent_time','day']).description('时间类型：recent_time（代表近日选择）/day（代表日期选择）'),
            time:Joi.string().required().description('【recent_time下选择】：today/yesterday/recent_7/recent_30 【day下选择】：日期格式YYYY-MM-DD,去除今日昨日的往前推8天时间'),
        });
        let obj:any = {};
        obj[valid] = val;
        obj.options = {
            allowUnknown: true,
        };
        return {
            description: '【带货直播分析】直播场次列表',
            notes: 'method:get',
            tags: ['api'],
            validate:obj
        }
    }
    
    export function goods_list(valid:string='payload'){
        let val = Joi.object({
            platform:Joi.number().required().description('平台号'),
            roomid:Joi.string().required().description('房间id'),
            time_type:Joi.string().required().allow(['recent_time','day']).description('时间类型：recent_time（代表近日选择）/day（代表日期选择）'),
            time:Joi.string().required().description('【recent_time下选择】：today/yesterday/recent_7/recent_30 【day下选择】：日期格式YYYY-MM-DD,去除今日昨日的往前推8天时间'),
        });
        let obj:any = {};
        obj[valid] = val;
        obj.options = {
            allowUnknown: true,
        };
        return {
            description: '【带货直播分析】直播商品列表',
            notes: 'method:get',
            tags: ['api'],
            validate:obj
        }
    }
    
    export function odata_get_anchor_info_batch(valid:string='payload'){
        let val = Joi.object({
            batch_pid_rid:Joi.string().required().description('格式：pid,rid|pid,rid')
        });
        let obj:any = {};
        obj[valid] = val;
        obj.options = {
            allowUnknown: true,
        };
        return {
            description: 'odata方式获取红人信息批量',
            notes: 'method:get',
            tags: ['api'],
            validate:obj
        }
    }
    
    export function odata_get_tag(valid:string='payload'){
        let val = Joi.object({
            tags:Joi.string().required().description('批量tag号')
        });
        let obj:any = {};
        obj[valid] = val;
        obj.options = {
            allowUnknown: true,
        };
        return {
            description: 'odata获取tag对照',
            notes: 'method:get',
            tags: ['api'],
            validate:obj
        }
    }
    
    export function get_guild_info_by_anchor(valid:string='payload'){
        let val = Joi.object({
            batch_pid_rid:Joi.string().required().description('格式：pid,rid|pid,rid')
        });
        let obj:any = {};
        obj[valid] = val;
        obj.options = {
            allowUnknown: true,
        };
        return {
            description: '通过红人获取公会信息（批量）',
            notes: 'method:get',
            tags: ['api'],
            validate:obj
        }
    }
}