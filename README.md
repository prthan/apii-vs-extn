# APIi


API Inspector, a visual code extension to test REST APIs from within visual code. The extension 
adds the following to VS Code

* File editor for files of type *.apii
* Adds a new command "API: New Inspection" 

## API Inspection File Format

This extension stores all the information for testing a REST API in a json file format with extension *.apii. The extension provides a custom editor to handle this file in VS Code

The developer can organize their test scripts for their end points as files in their workspace and use the new file editor to inspect the apis. Test response will be store in the file and will be available to view later too


![new-command]

![editor]

[new-command]: https://raw.githubusercontent.com/prthan/apii-vsc-extn/main/res/new-command.png
[editor]: https://raw.githubusercontent.com/prthan/apii-vsc-extn/main/res/editor.png