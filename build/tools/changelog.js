#!/usr/bin/env node

console.log('Collecting Change Log');

let since = '>=2019-05-03';

const request = require('request-promise-native');
const repo = 'cloudfoundry-incubator/stratos';
const fs = require('fs');

let url = 'https://api.github.com/search/issues?q=state:closed+repo:' + repo + '+updated:' + since;
url = url + '&per_page=100';

const fileName = './log.md';

console.log(url);

let total = -1;
let fetched = 0;
let results = [];

function fetchPage(url, page) {
  const pageUrl = url + '&page=' + page;
  return request(pageUrl, {
    headers: {
      'User-Agent': 'Changelog'
    },
    json: true}).then(data => {
      console.log('Fetched page    : ' + page);

      if (page === 1) {
        total = data.total_count;
        console.log('Total results : ' + total);
      }
      fetched += data.items.length;
      results = results.concat(data.items);

      if (fetched < total) {
        return fetchPage(url, page + 1);
      }
      console.log('Got all data');
    });
}

fetchPage(url, 1).then(data => {
  fs.writeFileSync(fileName, '# Changes\n');
  for(let i = 0; i<results.length;i++) {
    const item = results[i];
    let line = '- ' + item.title + ' [\\#' + item.number + '](' + item.html_url + ')\n';
    fs.appendFileSync(fileName, line);
  };

});
