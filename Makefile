# ----------------------------------------------------------------------------------------------
#   Copyright (c) Intel Corporation. All rights reserved.
#   Licensed under the MIT License. See License.txt in the project root for license information.
# ----------------------------------------------------------------------------------------------

build: 
	vsce package

install:
	code --install-extension intel-quantum-sdk-1.1.0.vsix

clean:
	code --uninstall-extension intel-quantum-sdk-1.1.0.vsix
	@echo "CTRL + SHIFT + P -> Reload Window" 

