const fs = require("fs");
const {WebVTTParser, WebVTTSerializer} = require("webvtt-parser");

function hmsmsToSeconds(h, m, s, ms) {
  return (h || 0)*3600 + (m || 0)*60 + (s || 0) + (ms || 0) / 1000;
}

function shift(webvttstring, add) {
  const parser = new WebVTTParser();
  const seri = new WebVTTSerializer();
  const {cues} = parser.parse(fs.readFileSync(process.argv[2], 'utf-8'));
  cues.forEach(c => {
    c.startTime += add;
    c.endTime += add;
  });
  return seri.serialize(cues);
}

function cli() {
  const timestampRegex = new RegExp("^(([0-9]?[0-9]:)?([0-5]?[0-9]:))?([0-5]?[0-9])(\.[0-9]+)?$");
  const argv = require('yargs')
        .command(['shift <webvtt> <time>', '$0'], 'Shifts the timed text of the WebVTT file by the specified time', yargs => {
          yargs.positional('webvtt', {
            describe: 'WebVTT file',
            type: 'string'
          }).positional('time', {
            describe: 'Time by which to shift the timed text, formatted as WebVTT timestamp: [[HH:]mm:]ss[.µµµ]',
            type: 'string'
          }).demandOption(['webvtt', 'time'])
        })
        .demandCommand(1)
        .check(argv => {
          if  (argv.time.match(timestampRegex) === null) {
            throw new Error("Invalid timestamp passed as second parameter");
          }
          if (!fs.existsSync(argv.webvtt)) {
            throw new Error("Can not find WebVTT file " + argv.webvtt);
          }
          return true;
        })
        .argv;
  let [,,h ,m ,s , ms] = argv.time.match(timestampRegex).map(s => s ? parseInt(s.replace(/[:\.]/, ''), 10) : s);
  // miliseconds needs to be adjusted to the size of the received number
  if (ms) {
    ms = parseInt(
      ("" + ms)
        .slice(0,3) // we only keep 3 digits
        .padEnd(3, '0') // and ensure we always have 3 digits
      , 10);
  }
  const webvtt = fs.readFileSync(argv.webvtt, 'utf-8');
  return shift(webvtt, hmsmsToSeconds(h, m, s, ms));
}

/**************************************************
Export the extract method for use as module
**************************************************/
module.exports = shift;


/**************************************************
Code run if the code is run as a stand-alone module
**************************************************/
if (require.main === module) {
  try {
    console.log(cli());
  } catch(e) {
    console.error(e);
    process.exit(64);
  }
}
