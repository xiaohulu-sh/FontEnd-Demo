
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
                path: '/v1_api/goods_list',
                options: routes_config.goods_list(QUERY),
                handler: async(request:Request, h:any) => {
                    return await api.goods_list(request,microtime());
                },
            },
            {
                method: ['GET'],
                path: '/v1_api/odata_get_anchor_info_batch',
                options: routes_config.odata_get_anchor_info_batch(QUERY),
                handler: async(request:Request, h:any) => {
                    return await odata.odata_get_anchor_info_batch(request,microtime());
                },
            },
            {
                method: ['GET'],
                path: '/v1_api/odata_get_tag',
                options: routes_config.odata_get_tag(QUERY),
                handler: async(request:Request, h:any) => {
                    return await odata.odata_get_tag(request,microtime());
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
                path: '/v1_api/odata_get_tag_classify',
                options: routes_config.odata_get_tag_classify(QUERY),
                handler: async(request:Request, h:any) => {
                    return await odata.odata_get_tag_classify(request,microtime());
                },
            },
            {
                method: ['GET'],
                path: '/v1_api/odata_anchor_list_by_type',
                options: routes_config.odata_anchor_list_by_type(QUERY),
                handler: async(request:Request, h:any) => {
                    return await odata.odata_anchor_list_by_type(request,microtime());
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
                path: '/v1_api/odata_anchor_list_by_batch',
                options: routes_config.odata_anchor_list_by_batch(QUERY),
                handler: async(request:Request, h:any) => {
                    return await odata.odata_anchor_list_by_batch(request,microtime());
                },
            },
            {
                method: ['GET'],
                path: '/v1_api/odata_locationname_list',
                options: routes_config.odata_locationname_list(QUERY),
                handler: async(request:Request, h:any) => {
                    return await odata.odata_locationname_list(request,microtime());
                },
            }
        ]);
    }
    
}