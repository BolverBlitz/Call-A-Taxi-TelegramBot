// Include simple modules
const fs = require('fs');
const util = require('util');

// Für Zeit Befehle
const Sekunde = 1000;
const Minute = Sekunde * 60;
const Stunde = Minute * 60;
const Tag = Stunde * 24;
const Monat = Tag * (365 / 12);
const Jahr = Tag * 365;

/**
 * Converts a false to ✅ and a true to ❌, if its nither it returns ❔
 * @param {boolean} bool
 * @returns {String}
 */
const ConvertBoolToEmoji = function ConvertBoolToEmoji(boolean) {
  if (boolean === true) {
    return '🔴';
  } if (boolean === false) {
    return '🟢';
  }
  return '❔';
};
/**
 * Converts a date into string dd.mm.yyyy hh:mm:ss
 * @param {Date}
 * @returns {String}
 */
const getDateTime = function getDateTime(date) {
  let hour = date.getHours();
  hour = (hour < 10 ? '0' : '') + hour;

  let min = date.getMinutes();
  min = (min < 10 ? '0' : '') + min;

  let sec = date.getSeconds();
  sec = (sec < 10 ? '0' : '') + sec;

  const year = date.getFullYear();

  let month = date.getMonth() + 1;
  month = (month < 10 ? '0' : '') + month;

  let day = date.getDate();
  day = (day < 10 ? '0' : '') + day;

  return `${day}.${month}.${year} ${hour}:${min}:${sec}`;
};

/**
 * Logs a event to log file
 * @param {String}
 */
const log = function log(info) {
  console.log(`${getDateTimelog(new Date())} ${info}`);
  fs.appendFile('./log/Bot.log', `\n${new Date()} ${info}`, (err) => {
    if (err) { console.log('Error, logging Text to logfile!', err); }
  });
};
/**
 * Logs a error to errorlog file
 * @param {String}
 */
const Elog = function Elog(info) {
  console.log(`${getDateTimelog(new Date())} ${info}`);
  fs.appendFile('./log/Error.log', `\n${new Date()} ${info}`, (err) => {
    if (err) { console.log('Error, logging Text to logfile!', err); }
  });
};

/**
 * Returns random Int from 0-max
 * @param {Int} max
 */
const getRandomInt = function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
};

/**
 * Returns random Int from 1-max
 * @param {Int} max
 */
const getRandomIntNo0 = function getRandomIntNo0(max) {
  return 1 + Math.floor(Math.random() * Math.floor(max));
};

/**
 * Converts a date into string split into days, hours, minutes and seconds
 * @param {Date}
 * @returns {String}
 */
const uptime = function uptime(Time_started) {
  const uptime = new Date().getTime() - Time_started;

  const uptimeTage = Math.floor((uptime) / Tag);
  const uptimeTageRest = uptime - (uptimeTage * Tag);

  const uptimeStunde = Math.floor((uptimeTageRest) / Stunde);
  const uptimeStundeRest = uptimeTageRest - (uptimeStunde * Stunde);

  const uptimeMinute = Math.floor((uptimeStundeRest) / Minute);
  const uptimeMinuteRest = uptimeStundeRest - (uptimeMinute * Minute);

  const uptimeSekunde = Math.floor((uptimeMinuteRest) / Sekunde);
  const uptimeSekundeRest = uptimeMinuteRest - (uptimeSekunde * Sekunde);

  let uptimeoutput = `\nSekunden: ${uptimeSekunde}`;
  if (uptimeMinute >= 1) {
    uptimeoutput = `\nMinuten: ${uptimeMinute}${uptimeoutput}`;
  }
  if (uptimeStunde >= 1) {
    uptimeoutput = `\nStunden: ${uptimeStunde}${uptimeoutput}`;
  }
  if (uptimeTage >= 1) {
    uptimeoutput = `\nTage: ${uptimeTage}${uptimeoutput}`;
  }
  return uptimeoutput;
};

/**
 * Returns number with 2 decimal places
 * @param {Int} max
 */
const Round2Dec = function Round2Dec(num) {
  return Math.round(num * 100) / 100;
};

/**
 * Capitalizes first Letter of a string
 * @param {String}
 * @returns {String}
 */
const capitalizeFirstLetter = function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
};

function getDateTimelog(date) {
  let hour = date.getHours();
  hour = (hour < 10 ? '0' : '') + hour;

  let min = date.getMinutes();
  min = (min < 10 ? '0' : '') + min;

  let sec = date.getSeconds();
  sec = (sec < 10 ? '0' : '') + sec;

  const year = date.getFullYear();

  let month = date.getMonth() + 1;
  month = (month < 10 ? '0' : '') + month;

  let day = date.getDate();
  day = (day < 10 ? '0' : '') + day;

  return `[${day}.${month}.${year}] [${hour}:${min}:${sec}]`;
}

/**
 * Cleans a string to be save
 * @param {String}
 * @returns {String}
 */
function cleanString(input) {
	var output = "";
    for (var i=0; i<input.length; i++) {
        if(input.charCodeAt(i) <= 127 || input.charCodeAt(i) === 223 || input.charCodeAt(i) === 252 || input.charCodeAt(i) === 228 || input.charCodeAt(i) === 246 || input.charCodeAt(i) === 196 || input.charCodeAt(i) === 214 || input.charCodeAt(i) === 220) {
			if(input.charCodeAt(i) != 39){
				output += input.charAt(i);
			}
        }
    }
    return output;
}

module.exports = {
  ConvertBoolToEmoji,
  getDateTime,
  log,
  Elog,
  getRandomInt,
  getRandomIntNo0,
  uptime,
  Round2Dec,
  capitalizeFirstLetter,
  cleanString
};
