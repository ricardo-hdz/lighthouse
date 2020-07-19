const fs = require('fs');
const glob = require('glob');

import { getReportDirectory, compareResultsToBaseline } from './reports';
import { audit } from './audit';
import config from './config';

audit(config.baseAuditPath).then((results: { js: any , json: any }) => {
    let dirName = getReportDirectory(config.baseAuditPath);
    
	// if(!fs.existsSync(dirName)) {
	//     fs.mkdirSync(dirName);
	// }
    const prevReports = glob(`${dirName}/*.json`, {
        sync: true
    });

    if (prevReports.length) {
        compareResultsToBaseline(dirName, prevReports, results);
    }

    // Save results
    fs.writeFile(`${dirName}/${results.js['fetchTime'].replace(/:/g, '_')}.json`, results.json, (err: any) => {
        if (err) throw err;
    });
});
