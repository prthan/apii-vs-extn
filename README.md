# APIi


API Inspector, a visual code extension to test REST/SOAP APIs from within visual code. The extension 
adds the following to VS Code

* File editor for files of type *.apii
* Adds a new command "API: New Inspection" -
* Adds a new command "APIi: New Inspection from WSDL"

![new-command]

![editor]

## API Inspection File Format

This extension stores all the information for testing an endpoint in a json file format with extension ***.apii**. 
The extension also provides a custom editor to handle this file in VS Code
Developers can organize the test scripts for their end points as files in their workspace and use the new file editor to inspect the apis. 
Response from testing the endpoint will also be stored in the file.

## Inspection from WSDL

Inspections can be generated from a WSDL too.
Choose the "APIi: New Inspection from WSDL" command

Provide the WSDL URL
![inspection-from-wsdl]

Select the operations for which the inspections needs to be generated
![wsdl-port-operations]

A folder is created in the current workspace with the inspections for the operations that were selected
![inspection-for-soap-operation]

[new-command]: https://raw.githubusercontent.com/prthan/apii-vsc-extn/main/res/new-command.png
[editor]: https://raw.githubusercontent.com/prthan/apii-vsc-extn/main/res/editor.png
[inspection-for-soap-operation]: https://raw.githubusercontent.com/prthan/apii-vsc-extn/main/res/inspection-for-soap-operation.png
[inspection-from-wsdl]: https://raw.githubusercontent.com/prthan/apii-vsc-extn/main/res/inspection-from-wsdl.png
[wsdl-port-operations]: https://raw.githubusercontent.com/prthan/apii-vsc-extn/main/res/wsdl-port-operations.png