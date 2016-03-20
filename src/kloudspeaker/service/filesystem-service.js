import {
    inject, LogManager
}
from 'aurelia-framework';

import {
    ServiceBase
}
from 'kloudspeaker/service/service-base';

let logger = LogManager.getLogger('filesystem-service');

@
inject(ServiceBase)
export class FilesystemService {
    constructor(service) {
        logger.debug("Filesystem service");
        this.service = service;        
    }

    folderInfo(fid, hierarchy, data) {
    	return this.service.post('filesystem/' + (fid ? fid : "roots") + "/info/" + (hierarchy ? "?h=1" : ""), data);
    }

    items(fid) {
        return this.service.get('filesystem/'+fid+'/items');
    }
}