const yandex = require('./.yandex.js');
const rp = require('request-promise-any');
const { Parser } = require('json2csv');
const fs = require('fs');
const Promise = require('bluebird');
const csvToJson = require('csvtojson');

async function resolveAddress(address) {
  const url = `https://geocode-maps.yandex.ru/1.x/?apikey=${yandex.key}&geocode=${encodeURIComponent(address)}&format=json`;
  return rp({
    url,
    json: true
  }).then(data => {
    return data.response;
  });
}

const LATITUDE = 'Широта';
const LONGITUDE = 'Долгота';
const DESCRIPTION1 = 'Описание';
const DESCRIPTION2 = 'Подпись';
const LINE_NO = 'Номер метки';

const opts = {
  fields: [LATITUDE, LONGITUDE, DESCRIPTION1, DESCRIPTION2, LINE_NO],
  delimiter: ';'
};
const parser = new Parser(opts);

Promise.resolve()
  .then(async() => {

    const addresses = await csvToJson().fromFile('addresses.csv');
    let lineNumber = 1;

    const records = await Promise.mapSeries(addresses, async input => {
      const address = input.address;
      const description = input.description.replace(/"/g, "'");

      function log(message) {
        console.info(`${lineNumber} ${address} : ${message}`);
      }

      function toCsvRecord(response) {
        if (!response) {
          log('No response');
          return;
        }

        const geo = response.GeoObjectCollection;
        if (!geo) {
          log('No GeoObjectCollection');
          return;
        }
        const metaDataProperty = geo.metaDataProperty;
        if (!metaDataProperty) {
          log('No metaDataProperty');
          return;
        }
        const geocoderResponseMetaData = metaDataProperty.GeocoderResponseMetaData;
        if (!geocoderResponseMetaData) {
          log('No GeocoderResponseMetaData');
          return;
        }
        const found = Number(geocoderResponseMetaData.found);
        if (!found || found < 1) {
          log(`Not found ${found}`);
          return;
        }
        const featureMember = geo.featureMember;
        if (!featureMember || !featureMember[0]) {
          log('No featureMember');
          return;
        }
        const geoObject = featureMember[0].GeoObject;
        if (!geoObject) {
          log('No GeoObject');
          return;
        }
        const point = geoObject.Point;
        if (!point || !point.pos) {
          log('No Point');
          return;
        }
        const [longitude, latitude] = point.pos.split(' ');

        const result = {};
        result[LATITUDE] = Number(latitude);
        result[LONGITUDE] = Number(longitude);
        result[DESCRIPTION1] = description + ": " + address;
        result[DESCRIPTION2] = description;
        result[LINE_NO] = lineNumber++;

        return  result;
      }

      log('Processing');
      const response = await resolveAddress(address);
      return toCsvRecord(response);
    }).filter(it => !!it);

    const csv = parser.parse(records);
    const file = process.argv[2];
    if (file) {
      fs.writeFileSync(file, csv)
    } else {
      console.info(csv)
    }
  });