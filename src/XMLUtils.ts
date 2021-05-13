import axios from 'axios';
import { JSDom } from './xml/jsdom';

import {WSDL} from './xml/wsdl';

export class XMLUtils
{
  static async fetchWSDLFromURL(wsdlURL :any)
  {
    let doFetch=(url :any)=>
    {
      let impl=async($res :any, $rej :any)=>
      {
        let options :any={method: "GET", url: url};
        let outcome :any={};
        
        axios(options)
        .then((res)=> outcome.res=res)
        .catch((err)=>
        {
          if(err.response) outcome.res=err.response;
          else outcome.err=err;
        })
        .finally(()=>
        {
          let res :any={};
          if(outcome.res)
          {
            if(outcome.res.status==200)
            {
              res.status={code: outcome.res.status, text: outcome.res.statusText};
              res.content=outcome.res.data;
            }
            else res.error={code: outcome.res.status, message: outcome.res.statusText, details: outcome.res.data};
          }
          if(outcome.err)
          {
            res.error={code: -1, message: outcome.err.message};
          }
          $res(res);
        })
      }
      return new Promise(impl);
    }

    let onprogress=(msg:string)=>
    {
      console.log(msg);
    }
    JSDom.fetch=doFetch;

    let wsdl=new WSDL();
    await wsdl.fetch(wsdlURL, {onprogress: onprogress});
    return wsdl;
  }

}