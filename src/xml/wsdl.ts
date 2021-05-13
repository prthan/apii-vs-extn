import {JSDom} from './jsdom';
import {XSD} from './xsd';
import {URL} from 'url';

export class WSDL extends JSDom
{
  public imports :any;
  public types :any;
  public "@location" :any;
  public schemas :any;
  public definitions :any;

  constructor(data? :any)
  {
    super(data);

    this.imports=[];
    this.types=null;
  }

  fetch(location :any, options :any)
  {
    let wsdl=this;
    let impl=async($res :any, $rej :any)=>
    {
      if(options.onprogress) options.onprogress(`Fetching wsdl ${location}`);
      let urlres :any=await wsdl.getURL(location, options);
      if(urlres.error)
      {
        $rej(new Error(`An error occured while loading the doc at ${location}. Error: ${urlres.error.code}, ${urlres.error.message}`));
        return;
      }
      wsdl.parse(urlres.content);
      wsdl["@location"]=location;

      if(!wsdl.doc.definitions)
      {
        $res();
        return;
      }

      for(let importTag of wsdl.array(wsdl.doc.definitions.import))
      {
        let importedWSDL=new WSDL();
        await importedWSDL.fetch(new URL(importTag["@location"], location).toString(), options);
        wsdl.imports.push(importedWSDL);
      };

      let types=wsdl.doc.definitions.types;
      if(types && types.schema)
      {
        let nsmap=Object.keys(wsdl.ns).reduce((a :any,c :any)=>{a[wsdl.ns[c]]=c; return a}, {});
        let schemaXML=wsdl.generateNode(types.schema, "schema", 0, nsmap);
        wsdl.types=new XSD(schemaXML);
        wsdl.types["@location"]=location;
        await wsdl.types.fetchImports(location, options);
      }

      let schemaMap :any={};
      let definitions=[];
      let list=[{t: "wsdl", o: wsdl}];
      while(list.length>0)
      {
        let item :any=list.shift();
        if(item.t=="wsdl")
        {
          if(item.o.types) list.push({t: "xsd", o: item.o.types});
          item.o.imports.forEach((w :any)=>list.push({t: "wsdl", o: w}));
          definitions.push(item.o.doc.definitions);
        }
        if(item.t=="xsd")
        {
          schemaMap[item.o["@location"]]=item.o;
          item.o.imports.forEach((x :any)=>list.push({t: "xsd", o: x}));
        }
      }
      
      wsdl.schemas=Object.values(schemaMap).map((x :any)=>{return {ns: x.ns, doc: x.doc, "@location": x["@location"]}});
      wsdl.definitions=definitions;
      $res();
    }
    return new Promise(impl);
  }

  getSOAPPort()
  {
    let wsdl=this;
    let data :any={portTypes: [], portTypeOperations: {}};
    let portTypeMap :any={};
    wsdl.definitions.forEach((definition :any)=>
    {
      portTypeMap=wsdl.array(definition.portType).reduce((a :any, pt :any)=>
      {
        let operationsMap=wsdl.array(pt.operation).reduce((ao :any, o :any)=>
        {
          ao[o["@name"]]=o;
          return ao;
        }, {});

        a[definition["@targetNamespace"]+"/"+pt["@name"]]=operationsMap;
        return a;
      }, portTypeMap);
    });

    let bindingAddressMap :any={};
    wsdl.definitions.forEach((definition :any)=>
    {
      wsdl.array(definition.service).forEach((ser :any)=>
      {
        wsdl.array(ser.port).forEach((port :any)=>
        {
          let bindingNameParts=port["@binding"].split(":");
          let ns=definition["@targetNamespace"];
          if(bindingNameParts.length>1) ns=definition[`@xmlns:${bindingNameParts[0]}`];
          let bindingName=bindingNameParts[bindingNameParts.length-1];
          bindingAddressMap[`${ns}/${bindingName}`]=port.address["@location"];
        });
      });
    });

    let messageElementMap :any={};
    wsdl.definitions.forEach((definition :any)=>
    {
      wsdl.array(definition.message).forEach((message :any)=>
      {
        let messageName=message["@name"];
        let messageNS=definition["@targetNamespace"];
        if(message.part["@name"]=="parameters")
        {
          let elementNameParts=message.part["@element"].split(":");
          let elementNS=definition["@targetNamespace"];
          if(elementNameParts.length>1) elementNS=definition[`@xmlns:${elementNameParts[0]}`];
          let elementName=elementNameParts[elementNameParts.length-1];
          messageElementMap[`${messageNS}/${messageName}`]={ns: elementNS, name: elementName};
        }
      });
    });
    
    wsdl.definitions.forEach((definition :any)=>
    {
      let soapBindings=wsdl.array(definition.binding).filter((binding :any)=>binding.binding && binding.binding["@transport"]=="http://schemas.xmlsoap.org/soap/http" && binding.binding["$ns"]=="http://schemas.xmlsoap.org/wsdl/soap/");
      soapBindings.forEach((soapBinding :any)=>
      {
        let endPoint=bindingAddressMap[definition["@targetNamespace"]+"/"+soapBinding["@name"]];
        let portTypeNameParts=soapBinding["@type"].split(":");
        let ns=definition["@targetNamespace"];;
        if(portTypeNameParts.length>1) ns=definition[`@xmlns:${portTypeNameParts[0]}`];
        let portTypeName=portTypeNameParts[portTypeNameParts.length-1];
        data.portTypes.push(portTypeName);
        let portTypeOperationsMap=portTypeMap[`${ns}/${portTypeName}`];
        let portTypeOperations :Array<any>=[];
        
        wsdl.array(soapBinding.operation).forEach((soapOperation :any)=>
        {
          let operation=portTypeOperationsMap[soapOperation["@name"]];
          let messageNameParts=operation.input["@message"].split(":");
          let messageName=messageNameParts[messageNameParts.length-1];
          let messageNameNS=definition["@targetNamespace"];
          if(messageNameParts.length>1) messageNameNS=definition[`@xmlns:${messageNameParts[0]}`];
          let inputElement=messageElementMap[`${messageNameNS}/${messageName}`];
          portTypeOperations.push({...operation, soapAction: soapOperation.operation["@soapAction"], endPoint: endPoint, inputElement: inputElement});
        })
        data.portTypeOperations[portTypeName]=portTypeOperations;
      })
    });
    return data;
  }
}
