import { CodeLensProvider, TextDocument, CodeLens, Range, Command } from "vscode";

class MyCodeLensProvider implements CodeLensProvider {
    async provideCodeLenses(document: TextDocument): Promise<CodeLens[]> {

        const codeLensArr: CodeLens[] = [];
        for (let lineNumber = 0; lineNumber < document.lineCount; lineNumber++) {
            const lineText = document.lineAt(lineNumber).text;
            const regexIsKernel = new RegExp(/^\s*quantum_kernel\b.*\(.*\)/)
            if (regexIsKernel.test(lineText)) {
                const regexKernelName = new RegExp(/\b\w+\b(?=\s?\s?\s?\s?\s?\s?\()/);
                let kernelName = regexKernelName.exec(lineText)![0]

                const lineRange = new Range(lineNumber, 0, lineNumber, lineText.length);
                let command: Command = {
                    command: 'intel-quantum.drawCircuitFromCPP',
                    title: 'View Circuit',
                    arguments: [kernelName]
                }
                codeLensArr.push(new CodeLens(lineRange, command));
            }
        }

        return codeLensArr
    }
}

export default MyCodeLensProvider;



