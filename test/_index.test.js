'use strict';

/**
 * Modified copy of https://github.com/svg/svgo/tree/master/test/plugins (see _index.test.js).
 */

const FS = require('fs');
const PATH = require('path');
const EOL = require('os').EOL;
const regEOL = new RegExp(EOL, 'g');
const regFilename = /^(.*)\.(\d+)\.svg$/;
const { optimize } = require('svgo');

const Ensure = require('../lib/Ensure');
const autocrop = Ensure.object(require('../index'));

describe('plugins tests', function () {
  FS.readdirSync(__dirname).forEach(function (file) {
    var match = file.match(regFilename),
      index,
      name;

    if (match) {
      name = match[1];
      index = match[2];

      file = PATH.resolve(__dirname, file);

      it(name + '.' + index, function () {
        return readFile(file).then(function (data) {
          // remove description
          const items = normalize(data).split(/\s*===\s*/);
          const test = items.length === 2 ? items[1] : items[0];
          // extract test case
          const [original, should, paramsStr] = test.split(/\s*@@@\s*/);
		  const params = paramsStr ? JSON.parse(paramsStr) : {};
          const plugin = {
            ...autocrop,
            params: params,
          };
          let lastResultData = original;
          // test plugins idempotence
          for (let i = 1; i <= 2; i++) {
            const result = optimize(lastResultData, {
              path: file + ".run" + i,
              plugins: [plugin],
              js2svg: { pretty: true },
            });
			if ( params.debug ) {
				console.debug("[Run " + i + "] " + file
					+ "\n[Input] " + lastResultData.trim()
					+ "\n[Output] " + normalize(result.data).trim());
			}
            lastResultData = result.data;
            expect(result.error).not.toEqual(expect.anything());
            //FIXME: results.data has a '\n' at the end while it should not
            expect(normalize(result.data)).toEqual(should);
          }
        });
      });
    }
  });
});

function normalize(file) {
  return file.trim().replace(regEOL, '\n');
}

function readFile(file) {
  return new Promise(function (resolve, reject) {
    FS.readFile(file, 'utf8', function (err, data) {
      if (err) return reject(err);
      resolve(data);
    });
  });
}
