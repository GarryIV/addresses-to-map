const yandex = require('./.yandex.js');
const rp = require('request-promise-any');
const { Parser } = require('json2csv');
const fs = require('fs');
const Promise = require('bluebird');

async function test(address) {
  const url = `https://geocode-maps.yandex.ru/1.x/?apikey=${yandex.key}&geocode=${encodeURIComponent(address)}&format=json`;
  return rp({
    url,
    json: true
  }).then(data => {
    return data.response;
  });
}

const opts = {
  fields: ['Широта', 'Долгота', 'Описание', 'Подпись', 'Номер метки'],
  delimiter: ';'
};
const parser = new Parser(opts);

Promise.resolve()
  .then(async() => {
    const address = '121099, г.Москва, ул.Новый Арбат, д.23';
    const description = 'Общество с ограниченной ответственностью "ЛИК-Лидер"';

    function log(message) {
      console.info(`${address} : ${message}`);
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

      return  {
        'Широта': Number(latitude),
        'Долгота': Number(longitude),
        'Описание': description,
        'Подпись': description,
        'Номер метки': 1,
      };
    }

    const response =  require('./test'); //await test("121099, г.Москва, ул.Новый Арбат, д.23");

    const record = toCsvRecord(response);
    const csv = parser.parse([record]);

    const file = process.argv[2];
    if (file) {
      fs.writeFileSync(file, csv)
    } else {
      console.info(csv)
    }
  });