const yandex = require('./.yandex.js');
const rp = require('request-promise-any');

async function test(address) {
  const url = `https://geocode-maps.yandex.ru/1.x/?apikey=${yandex.key}&geocode=${encodeURIComponent(address)}&format=json`;
  return rp({
    url,
    json: true
  }).then(data => {
    return data.response;
  });
}

Promise.resolve()
  .then(async() => {
    const message = JSON.stringify(await test("г.Москва, Тверская 6"));
    console.info(message)
  });