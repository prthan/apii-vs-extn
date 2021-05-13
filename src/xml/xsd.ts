import {JSDom} from './jsdom';
import {URL} from 'url';

export class XSD extends JSDom
{
  public imports :any;
  public importMap :any;
  public schemaMap :any;
  public schemas :any;
  public "@location" :any;

  constructor(data? :any)
  {
    super(data);
    this.imports=[];
    this.importMap={};
  }

  /*addDom(dom :any)
  {
    let xsd=this;

    Object.keys(dom.doc).forEach((key)=>wsdl.doc[key]=dom.ns[key]);
    Object.keys(dom.ns).forEach((key)=>xsd.ns[key]=dom.ns[key]);

  }*/

  fetch(location :any, options :any)
  {
    let xsd=this;
    let impl=async($res :any, $rej :any)=>
    {
      //console.info(`fetching xsd ==> ${location}`);
      if(options.onprogress) options.onprogress(`Fetching xsd ${location}`);
      let urlres :any=await xsd.getURL(location, options);
      if(urlres.error)
      {
        $rej(new Error(`An error occured while loading the doc at ${location}. Error: ${urlres.error}`));
        return;
      }
      xsd.parse(urlres.content);
      xsd["@location"]=location;

      await xsd.fetchImports(location, options);
      $res();
    }
    return new Promise(impl);
  }

  fetchImports(location :any, options :any)
  {
    let xsd=this;
    let impl=async($res :any, $rej :any)=>
    {
      for(let importTag of [...xsd.array(xsd.doc.schema.import), ...xsd.array(xsd.doc.schema.include)])
      {
        let importURL=new URL(importTag["@schemaLocation"], location).toString();
        if(!xsd.importMap[importURL])
        {
          xsd.importMap[importURL]="fetched";
          let importedXSD=new XSD();
          importedXSD.importMap=xsd.importMap;
          await importedXSD.fetch(importURL, options);
          xsd.imports.push(importedXSD);
          delete importedXSD.importMap;
        }
      };
      $res();
    }

    return new Promise(impl);
  }

  createSchemaMap()
  {
    let xsd=this;
    xsd.schemaMap=xsd.schemas.reduce((a :any, xs :any)=>
    {
      let schema=xs.doc.schema;
      a[`$ns/${schema["@targetNamespace"]}`]=xs;
      Object.keys(schema).forEach((key)=>
      {
        xsd.array(schema[key]).filter((o=>o["@name"])).forEach((o)=>
        {
          a[`${schema["@targetNamespace"]}/${o["@name"]}`]={defn: o, xsd: xs, type: key};
        })
      })
      return a;
    }, {});
  }

  typeOf(v :any, ns :any)
  {
    let typeParts=v.split(":");
    let typeName=typeParts[typeParts.length-1];
    let typeNS="http://www.w3.org/2001/XMLSchema";
    if(typeParts.length>1) typeNS=ns[typeParts[0]];
    return {typeNS: typeNS, typeName: typeName}
  }

  createObject(name :any, ns :any, oname? :any)
  {
    let x=this;
    let defn=x.schemaMap[`${ns}/${name}`].defn;
    let defnType=x.schemaMap[`${ns}/${name}`].type;
    let defnNS=x.schemaMap[`${ns}/${name}`].xsd.ns;
    let xs=x.schemaMap[`$ns/${ns}`];

    if(defnType=="element")
    {
      if(defn["@type"])
      {
        let {typeNS, typeName}=x.typeOf(defn["@type"], defnNS);
        if(typeNS!="http://www.w3.org/2001/XMLSchema")
        {
          let ctDefn=x.schemaMap[`${typeNS}/${typeName}`].defn;
          let obj :any={};
          obj[oname || name]=x.createObjectFromComplexType(ctDefn, x.schemaMap[`$ns/${typeNS}`]);
          return obj;
        }
      }
      if(defn.complexType)
      {
        let obj :any={};
        obj[oname || name]=x.createObjectFromComplexType(defn.complexType, xs);
        return obj;
      }
    }

    if(defnType=="complexType")
    {
      let obj :any={};
      obj[oname || name]=x.createObjectFromComplexType(defn, xs);
      return obj;
    }

    return null;
  }

  createObjectFromComplexType(ctdefn :any, xsd :any)
  {
    let x=this;
    let tns=xsd.doc.schema["@targetNamespace"];
    let obj :any={$ns: tns};

    if(ctdefn.sequence)
    {
      x.array(ctdefn.sequence.element).forEach((e)=>
      {
        let field :any={};
        let {typeNS, typeName}=x.typeOf(e["@type"], xsd.ns);

        if(typeNS=="http://www.w3.org/2001/XMLSchema") field["$value"]="";
        else field=x.createObjectFromComplexType(x.schemaMap[`${typeNS}/${typeName}`], x.schemaMap[`$ns/${typeNS}`]);
        
        field.$ns=tns;
        obj[e["@name"]]=field;
      })
    }

    if(ctdefn.choice)
    {
      x.array(ctdefn.choice.element).forEach((e)=>
      {
        let field :any={};
        let {typeNS, typeName}=x.typeOf(e["@type"], xsd.ns);

        if(typeNS=="http://www.w3.org/2001/XMLSchema") field["$value"]="";
        else field=x.createObjectFromComplexType(x.schemaMap[`${typeNS}/${typeName}`], x.schemaMap[`$ns/${typeNS}`]);
        
        field.$ns=tns;
        obj[e["@name"]]=field;
      })
    }

    return obj;
  }
}
