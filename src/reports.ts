const fs = require('fs');
import { URL } from 'url';
const path = require('path');
import config from './config';

export function getContents(pathStr: string):any {
	const output = fs.readFileSync(pathStr, 'utf8', (err: any, results: any) => {
		return results;
	});
	return JSON.parse(output);
};

export function compareReports(from: any, to: any) {
	const metricFilter = [
		'first-contentful-paint',
		'first-meaningful-paint',
		'speed-index',
		'estimated-input-latency',
		'total-blocking-time',
		'max-potential-fid',
		'time-to-first-byte',
		'first-cpu-idle',
		'interactive'
	];

	const calculatePercentageDiff = (from: number, to: number) => {
		const per = ((to - from) / from) * 100;
		return Math.round(per * 100) / 100;
	};

	for(let auditObj in from['audits']) {
		if(metricFilter.includes(auditObj)) {
			const percentageDiff = calculatePercentageDiff(
				from['audits'][auditObj].numericValue,
				to['audits'][auditObj].numericValue
			);

			let logColor = '\x1b[37m';
			const log = (() => {
				if(Math.sign(percentageDiff) === 1) {
					logColor = "\x1b[31m";
					return `${percentageDiff.toString().replace('-','') + '%'} slower`;
				}
				else if(Math.sign(percentageDiff) === 0) {
					return 'unchanged';
				}
				else {
					logColor = "\x1b[32m";
					return `${percentageDiff.toString().replace('-','') + '%'} faster`;
				}
			})();
			console.log(logColor, `- ${from['audits'][auditObj].title} is ${log}`);
		}
	}
}

export function getReportDirectory(url: string):string {
	const urlObj = new URL(url);
    
	let dirName = urlObj.host.replace('www.','');
	if(urlObj.pathname !== '/') {
		dirName = dirName + urlObj.pathname.replace(/\//g,'_');
	}

	// Create a directory structure like the following
    // {hostname} - top parent dir
    // -- {date}.json
    // -- {date}.json
	// if (!fs.existsSync(config.auditsDirectory)) {
	//     fs.mkdirSync(config.auditsDirectory);
	// }

	if (!fs.existsSync(config.auditsDirectory + '/' + dirName)) {
	    fs.mkdirSync(config.auditsDirectory + '/' + dirName, { recursive: true});
	}

	return config.auditsDirectory + '/' + dirName;
}

export function compareResultsToBaseline(dirName: string, prevReports: { [x: string]: any; }, results: { js: any , json: any }) {
	let dates = [];
	for (const report in prevReports) {
		dates.push(new Date(path.parse(prevReports[report]).name.replace(/_/g, ':')));
	}
	const max = dates.reduce((acc, currentVal) => {
		return acc > currentVal ? acc : currentVal;
	});

	const recentReport = new Date(max).toISOString();
	console.log('\x1b[33m', `Comparing test results from ${ recentReport } to ${ new Date().toISOString() }`);
	const recentReportContents = getContents(dirName + '/' + recentReport.replace(/:/g, '_') + '.json');
	compareReports(recentReportContents, results.js);
}