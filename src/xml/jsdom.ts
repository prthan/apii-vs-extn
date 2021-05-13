const sax=require('sax');

export class JSDom
{
  public doc :any;
  public ns :any;
  public instructions :any;
  
  constructor(data? :any)
  {
    this.doc=null;
    this.ns={};
    this.instructions=[];
    if(data) this.parse(data);
  }

  parse(data :any)
  {
    let jsdom=this;
    let obj :any={};
    let tagsPath :Array<any>=[];

    let saxparser=sax.parser(true, {xmlns: true, trim: true});
    saxparser.onerror=(e :any)=>console.log(e);
    saxparser.onopentag=(node :any)=>
    {
      let tag={$ns: node.ns[node.prefix]};
      jsdom.setAttributes(tag, node.attributes);
      //let tagName=`${node.prefix ? node.prefix +':' : ''}${node.local}`;
      //let tagName=`{${node.ns[node.prefix]}}${node.local}`;
      let tagName=`${node.local}`;
      if(!obj[tagName]) obj[tagName]=tag;
      else 
      {
        let _tag=obj[tagName];
        if(_tag instanceof Array) _tag.push(tag);
        else obj[tagName]=[_tag, tag];
      }
      tagsPath.push(obj);
      obj=tag;

      Object.keys(node.ns).filter((k)=>k!="").forEach((key)=>jsdom.ns[key]=node.ns[key]);
    }
    saxparser.onclosetag=()=>
    {
      obj=tagsPath.pop();
    }
    saxparser.ontext=(text :any)=>obj.$value=text;
    saxparser.oncdata=(text :any)=>obj.$value=text;
    saxparser.onprocessinginstruction=(instruction :any)=>
    {
      jsdom.instructions.push(instruction);
    }
    saxparser.write(data).close();
    
    jsdom.doc=obj;
  }

  setAttributes(obj :any, attrs :any)
  {
    Object.keys(attrs).forEach((key)=>obj[`@${key}`]=attrs[key].value);
  }

  array(a :any)
  {
    if(a==null) return [];
    return a instanceof Array ? a : [a];
  }

  generate(indent :any)
  {
    let dom=this;
    let rootName=Object.keys(dom.doc)[0];
    let nsmap=Object.keys(dom.ns).reduce((a :any,c :any)=>{a[dom.ns[c]]=c; return a}, {});
    let instructions=dom.instructions.reduce((a :any,c :any)=>a+=`<?${c.name} ${c.body}?>\n`, "");

    return instructions + dom.generateNode(dom.doc[rootName], rootName, indent, nsmap);
  }

  generateNode(o :any, name :any, indent :any, nsmap :any, level? :any)
  {
    let dom=this;
    let nl="\n";
    if(!indent)
    {
      indent=0;
      nl="";
    }
    if(!level) level=0;
    let spaces=`${dom.space(level * indent)}`;
    let tags :Array<any>=[];

    let list = o instanceof Array ? o : [o];

    list.forEach((node)=>
    {
      let prefix="";
      let ns="";
      if(nsmap && nsmap[node.$ns]) prefix=nsmap[node.$ns] + ":";
      if(prefix=="" && node.$ns) ns=` xmlns="${node.$ns}"`;
      
      let nsvals="";
      if(level==0 && nsmap) nsvals=Object.keys(nsmap).reduce((a,c)=>a+=` xmlns:${nsmap[c]}="${c}"`, "");


      if(node.$value || node.$value=="") tags.push(`${spaces}<${prefix}${name}${ns}${nsvals}${dom.attrs(node)}>${node.$value}</${prefix}${name}>`);
      else
      {
        let openTag=`${spaces}<${prefix}${name}${ns}${nsvals}${dom.attrs(node)}`;
        let closeTag=`</${prefix}${name}>`;

        let childTags=Object.keys(node).filter(x=>x!="$ns"&&x.indexOf("@")!=0)
                                        .reduce((a,c,i)=>
                                        {
                                          return a+=nl+dom.generateNode(node[c], c, indent, nsmap, level + 1)
                                        }, "");
        if(childTags=="") tags.push(`${openTag}/>`);
        else tags.push(`${openTag}>${childTags}${nl}${spaces}${closeTag}`);
      }
    });

    return tags.join(nl);
  }

  
  attrs(obj :any)
  {
    //console.log(obj);
    let attrsText=Object.keys(obj).filter(x=>x.indexOf("@")==0).reduce((a, c)=>a+=` ${c.substring(1)}="${obj[c]}"`, "");
    return attrsText;
  }

  space(x :any)
  {
    return new Array(x).fill(" ").join("");
  }

  getURL(url :any, options :any)
  {
    return JSDom.fetch(url, options);
  }

  static fetch(url :any, options :any)
  {
    let impl=($res :any, $rej :any)=>
    {
      let res={content: "<data>fetch method not reimplemented</data>", status: {code: 404, text: "Fetch method not implemented"}};
      $res({res: res});
    }
    return new Promise(impl);
  }
}
