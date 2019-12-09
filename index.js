const yandex = require('./.yandex.js');
const rp = require('request-promise-native');

async function test() {
  const surl = `https://geocode-maps.yandex.ru/1.x/?apikey=${yandex.key}&geocode=Москва,+Тверская+улица,+дом+7`;
  return rp(surl)
    .then(function (htmlString) {
      console.log(htmlString);
    });
}

Promise.resolve()
  .then(() => test());