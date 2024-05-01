# ----------------------------------------------------------------------------------------------
#   Copyright (c) Intel Corporation. All rights reserved.
#   Licensed under the MIT License. See License.txt in the project root for license information.
# ----------------------------------------------------------------------------------------------

#https://stackoverflow.com/questions/36664010
define GetFromPkg
$(shell node -p "require('./package.json').$(1)")
endef

EXT_NAME     := $(call GetFromPkg,name)
EXT_VERSION  := $(call GetFromPkg,version)
EXT_FILE     := ${EXT_NAME}-${EXT_VERSION}.vsix

#name:
#	@echo ${EXT_FILE}

build: 
	npx vsce package

install:
	code --install-extension ${EXT_FILE}

clean:
	code --uninstall-extension ${EXT_FILE}
	@echo "CTRL + SHIFT + P -> Reload Window" 

podman:
	podman run -it --rm --name quantum -v ~/workspace:/opt/intel/data intellabs/intel_quantum_sdk

docker:
	docker run -it --name quantum -v ~/workspace:/opt/intel/data intellabs/intel_quantum_sdk
