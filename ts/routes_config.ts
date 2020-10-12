import Joi from '@hapi/joi';

export module routes_config{
    export function admin_login(valid:string='payload'){
        let val = Joi.object({
            // platform:Joi.number().required().allow([1,2,3,4]).description('类型：1.数据服务2.工具服务3.报表服务4.点数充值'),
            // page:Joi.number().default(1).description('页号'),
            // limit:Joi.number().default(10).description('分页参数，指定获取数量'),
        });
        let obj:any = {};
        obj[valid] = val;
        obj.options = {
            allowUnknown: true,
        };
        return {
            description: '按创作类型筛选红人',
            notes: 'method:get',
            tags: ['api','search'],
            validate:obj
        }
    }
}