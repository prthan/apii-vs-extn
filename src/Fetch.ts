import axios from 'axios';

export class Fetch
{
  public static exec(inspection :any)
  {
    let impl=async(res$ :any, rej$ :any)=>
    {
      let options:any=
      {
        method: inspection.target.method,
        url: inspection.target.endpoint,
      };
  
      let headers :any={};
      inspection.request.headers.forEach((item :any)=>
      {
        if(item.header && item.header!="") headers[item.header]=item.value;
      });
      options.headers=headers;
      options.transformResponse=[];
      if(['PUT', 'POST', 'DELETE', 'PATCH'].includes(inspection.target.method)) options.data=inspection.request.content;
    
      let outcome:any={startTime: process.hrtime()};
      axios(options)
      .then((res :any)=>outcome.res=res)
      .catch((err :any)=>
      {
        if(err.response) outcome.res=err.response; 
        else outcome.err=err; 
      })
      .finally(()=>
      {
        outcome.timeDiff=process.hrtime(outcome.startTime);
        if(outcome.res) Fetch.copyRes(outcome.res, inspection);
        if(outcome.err) inspection.response.error=outcome.err.message;
        inspection.response.time=outcome.timeDiff[0]*1000 + outcome.timeDiff[1] / 1000000;
        inspection.response.time=Math.round(inspection.response.time*1000+0.5)/1000;
        res$(inspection);
      })
    }
    return new Promise(impl);
  }

  public static copyRes(res :any, inspection :any)
  {
    inspection.response.status={code: res.status, text: res.statusText};
    inspection.response.content=res.data;
  
    inspection.response.headers=[];
    Object.keys(res.headers).forEach((header)=>inspection.response.headers.push({header: header, value: res.headers[header]}));
  }  

  public static getURL(url :string) : Promise<any>
  {
    let impl=async($res :any, $rej :any)=>
    {
      let options :any={method: "GET", url: url};
      let outcome :any={};
      
      axios(options)
      .then((res)=>outcome.res=res)
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
}