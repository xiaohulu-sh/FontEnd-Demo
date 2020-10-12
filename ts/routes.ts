
import {routes_config} from './routes_config';
// import { admin } from '../end/admin';

export module routes {
    const QUERY = 'query';
    
    function microtime(){
        return new Date().getTime()/1000;
    }

    export async function api(server:any){
        return server.route([
            {
                method: ['POST'],
                path: '/admin/login',
                options: routes_config.admin_login(),
                handler: async(request:Request, h:any) => {
                    return 1111;
                },
            }
        ]);
    }
    
}