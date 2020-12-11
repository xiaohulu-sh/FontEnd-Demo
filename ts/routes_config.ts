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
            price:Joi.string().default().description('价格区间：空=》不限，其余字符串传递格式（如100元-500元：100-500，如500元以上：500-0,如50元以下：0-50）'),
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
            description: '【带货直播分析】直播商品列表',
            notes: 'method:get',
            tags: ['api'],
            validate:obj
        }
    }
    
    export function goods_list_recent30(valid:string='payload'){
        let val = Joi.object({
            platform:Joi.number().required().description('平台号'),
            roomid:Joi.string().required().description('房间id'),
            price:Joi.string().default().description('价格区间：空=》不限，其余字符串传递格式（如100元-500元：100-500，如500元以上：500-0,如50元以下：0-50）'),
            brand_name:Joi.string().default().description('商品品牌：空=》不限，填名称(需要encode传递)'),
            tag_name:Joi.string().default().description('商品品类：空=》不限，填名称(需要encode传递)'),
            plat_label:Joi.string().default().description('商品来源：空=》不限，填名称(需要encode传递)'),
            page:Joi.number().default(1).description('页号'),
            limit:Joi.number().default(10).description('获取数量，每页最多10')
        });
        let obj:any = {};
        obj[valid] = val;
        obj.options = {
            allowUnknown: true,
        };
        return {
            description: '【带货直播分析】直播商品列表(近30天)',
            notes: 'method:get',
            tags: ['api'],
            validate:obj
        }
    }
    export function goods_recent30_brand_info(valid:string='payload'){
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
            description: '【带货直播分析】电商红人近30天品类品牌统计（返回结果里若包含status=waitting,说明是异步等待接口，需要做等待机制。goods_list_recent30接口需要等待此接口结果才能调用）',
            notes: 'method:get',
            tags: ['api'],
            validate:obj
        }
    }
    
    export function odata_tag_list(valid:string='payload'){
        let val = Joi.object({
        });
        let obj:any = {};
        obj[valid] = val;
        obj.options = {
            allowUnknown: true,
        };
        return {
            description: 'odata获取标签列表',
            notes: 'method:get',
            tags: ['api'],
            validate:obj
        }
    }
    
    export function sales_anchors_by_goods(valid:string='payload'){
        let val = Joi.object({
            plat_type:Joi.number().default().description('平台类型：空=》全部 201.抖音 202.快手'),
            tags:Joi.string().default().description('创作类型：空=》全部 ，标签ids'),
            single_live_agv_sale:Joi.string().default().description('单场平均销售额：空=》不限，其余字符串传递格式（如1万-5万：10000-50000，如10万以上：100000-0,如1万以下：0-10000）'),
            goods_agv_sale:Joi.string().default().description('带货平均客单价：空=》不限，其余字符串传递格式（如1万-5万：10000-50000，如10万以上：100000-0,如1万以下：0-10000）'),
            live_count:Joi.string().default().description('直播场次：空=》不限，其余字符串传递格式（如1万-5万：10000-50000，如10万以上：100000-0,如1万以下：0-10000）'),
            fans_count:Joi.string().default().description('主播粉丝：空=》不限，其余字符串传递格式（如1万-5万：10000-50000，如10万以上：100000-0,如1万以下：0-10000）'),
            live_online_count:Joi.string().default().description('直播在线人数：空=》不限，其余字符串传递格式（如1万-5万：10000-50000，如10万以上：100000-0,如1万以下：0-10000）'),
            sort_by:Joi.number().default(6).allow([1,2,3,4,5,6]).description('按什么排序排序：1销售额，2 销售量，3单场平均销售额，4带货商品客单价，5直播场次，6主播粉丝,默认销售额'),
            sort_type:Joi.number().default(2).allow([1,2]).description('排序升降序：1降序，2 升序，默认降序'),
            page:Joi.number().default(1).description('页号'),
            limit:Joi.number().default(30).description('分页参数，指定获取数量(暂定最大30个)'),
        });
        let obj:any = {};
        obj[valid] = val;
        obj.options = {
            allowUnknown: true,
        };
        return {
            description: '按照带货品类搜索红人',
            notes: 'method:get',
            tags: ['api'],
            validate:obj
        }
    }
    export function odata_filter_tags(valid:string='payload'){
        let val = Joi.object({
            tagIds:Joi.string().default().description('标签组（可批量，英文逗号相隔）'),
        });
        let obj:any = {};
        obj[valid] = val;
        obj.options = {
            allowUnknown: true,
        };
        return {
            description: 'odata获取筛选标签组',
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
    
    export function get_guild_detail_info_by_anchor(valid:string='payload'){
        let val = Joi.object({
            pid:Joi.number().required().description('平台号'),
            rid:Joi.string().required().description('房间号')
        });
        let obj:any = {};
        obj[valid] = val;
        obj.options = {
            allowUnknown: true,
        };
        return {
            description: '通过红人获取公会详细信息',
            notes: 'method:get',
            tags: ['api'],
            validate:obj
        }
    }
    export function clear_cache(valid:string='payload'){
        let val = Joi.object({
            keys:Joi.string().required().description('keys名称')
        });
        let obj:any = {};
        obj[valid] = val;
        obj.options = {
            allowUnknown: true,
        };
        return {
            description: '清理缓存(系统级功能，不可胡乱使用)',
            notes: 'method:get',
            tags: ['api'],
            validate:obj
        }
    }
}