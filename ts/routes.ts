
import {routes_config} from './routes_config';
import { api } from './controllers/api';
import { odata } from './controllers/odata';

export module routes {
    const QUERY = 'query';
    
    function microtime(){
        return new Date().getTime()/1000;
    }

    export async function v1_api(server:any){
        return server.route([
            {
                method: ['GET'],
                path: '/v1_api/anchor_base_info',
                options: routes_config.anchor_base_info(QUERY),
                handler: async(request:Request, h:any) => {
                    return await api.anchor_base_info(request,microtime());
                },
            },
            {
                method: ['GET'],
                path: '/v1_api/video_data_summary',
                options: routes_config.video_data_summary(QUERY),
                handler: async(request:Request, h:any) => {
                    return await api.video_data_summary(request,microtime());
                },
            },
            {
                method: ['GET'],
                path: '/v1_api/data_trend_line',
                options: routes_config.data_trend_line(QUERY),
                handler: async(request:Request, h:any) => {
                    return await api.data_trend_line(request,microtime());
                },
            },
            {
                method: ['GET'],
                path: '/v1_api/video_issue_frequency',
                options: routes_config.video_issue_frequency(QUERY),
                handler: async(request:Request, h:any) => {
                    return await api.video_issue_frequency(request,microtime());
                },
            },
            {
                method: ['GET'],
                path: '/v1_api/video_list',
                options: routes_config.video_list(QUERY),
                handler: async(request:Request, h:any) => {
                    return await api.video_list(request,microtime());
                },
            },
            {
                method: ['GET'],
                path: '/v1_api/tycoon_list',
                options: routes_config.tycoon_list(QUERY),
                handler: async(request:Request, h:any) => {
                    return await api.tycoon_list(request,microtime());
                },
            },
            {
                method: ['GET'],
                path: '/v1_api/overview',
                options: routes_config.overview(QUERY),
                handler: async(request:Request, h:any) => {
                    return await api.overview(request,microtime());
                },
            },
            {
                method: ['GET'],
                path: '/v1_api/anchor_live_record',
                options: routes_config.anchor_live_record(QUERY),
                handler: async(request:Request, h:any) => {
                    return await api.anchor_live_record(request,microtime());
                },
            },
            {
                method: ['GET'],
                path: '/v1_api/anchor_live_comprehensive_data',
                options: routes_config.anchor_live_comprehensive_data(QUERY),
                handler: async(request:Request, h:any) => {
                    return await api.anchor_live_comprehensive_data(request,microtime());
                },
            },
            {
                method: ['GET'],
                path: '/v1_api/portrait',
                options: routes_config.portrait(QUERY),
                handler: async(request:Request, h:any) => {
                    return await api.portrait(request,microtime());
                },
            },
            {
                method: ['GET'],
                path: '/v1_api/dyshop_overview',
                options: routes_config.dyshop_overview(QUERY),
                handler: async(request:Request, h:any) => {
                    return await api.dyshop_overview(request,microtime());
                },
            },
            {
                method: ['GET'],
                path: '/v1_api/live_list',
                options: routes_config.live_list(QUERY),
                handler: async(request:Request, h:any) => {
                    return await api.live_list(request,microtime());
                },
            },
            {
                method: ['GET'],
                path: '/v1_api/goods_recent30_brand_info',
                options: routes_config.goods_recent30_brand_info(QUERY),
                handler: async(request:Request, h:any) => {
                    return await api.goods_recent30_brand_info(request,microtime());
                },
            },
            {
                method: ['GET'],
                path: '/v1_api/goods_list_recent30',
                options: routes_config.goods_list_recent30(QUERY),
                handler: async(request:Request, h:any) => {
                    return await api.goods_list_recent30(request,microtime());
                },
            },
            {
                method: ['GET'],
                path: '/v1_api/goods_list',
                options: routes_config.goods_list(QUERY),
                handler: async(request:Request, h:any) => {
                    return await api.goods_list(request,microtime());
                },
            },
            {
                method: ['GET'],
                path: '/v1_api/get_guild_info_by_anchor',
                options: routes_config.get_guild_info_by_anchor(QUERY),
                handler: async(request:Request, h:any) => {
                    return await api.get_guild_info_by_anchor(request,microtime());
                },
            },
            {
                method: ['GET'],
                path: '/v1_api/get_guild_detail_info_by_anchor',
                options: routes_config.get_guild_detail_info_by_anchor(QUERY),
                handler: async(request:Request, h:any) => {
                    return await api.get_guild_detail_info_by_anchor(request,microtime());
                },
            },
            {
                method: ['GET'],
                path: '/v1_api/clear_cache',
                options: routes_config.clear_cache(QUERY),
                handler: async(request:Request, h:any) => {
                    return await api.clear_cache(request,microtime());
                },
            },
            {
                method: ['GET'],
                path: '/v1_api/odata_tag_list',
                options: routes_config.odata_tag_list(QUERY),
                handler: async(request:Request, h:any) => {
                    return await odata.odata_tag_list(request,microtime());
                },
            },
            {
                method: ['GET'],
                path: '/v1_api/odata_filter_tags',
                options: routes_config.odata_filter_tags(QUERY),
                handler: async(request:Request, h:any) => {
                    return await odata.odata_filter_tags(request,microtime());
                },
            },
            {
                method: ['GET'],
                path: '/v1_api/odata_all_anchors',
                options: routes_config.odata_all_anchors(QUERY),
                handler: async(request:Request, h:any) => {
                    return await odata.odata_all_anchors(request,microtime());
                },
            },
            {
                method: ['GET'],
                path: '/v1_api/odata_single_anchors_info',
                options: routes_config.odata_single_anchors_info(QUERY),
                handler: async(request:Request, h:any) => {
                    return await odata.odata_single_anchors_info(request,microtime());
                },
            },
            {
                method: ['GET'],
                path: '/v1_api/sales_anchors_by_goods',
                options: routes_config.sales_anchors_by_goods(QUERY),
                handler: async(request:Request, h:any) => {
                    return await api.sales_anchors_by_goods(request,microtime());
                },
            },
            {
                method: ['GET'],
                path: '/v1_api/sales_anchors_goodat_goods',
                options: routes_config.sales_anchors_goodat_goods(QUERY),
                handler: async(request:Request, h:any) => {
                    return await api.sales_anchors_goodat_goods(request,microtime());
                },
            },
            {
                method: ['GET'],
                path: '/v1_api/get_anchor_pid_record',
                options: routes_config.get_anchor_pid_record(QUERY),
                handler: async(request:Request, h:any) => {
                    return await api.get_anchor_pid_record(request,microtime());
                },
            }
        ]);
    }
    
}