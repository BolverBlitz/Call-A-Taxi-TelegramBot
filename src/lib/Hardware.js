const si = require('systeminformation');

const Hardware = new Promise((resolve, reject) => {
  const Output = '';
  si.cpu()
    .then((cpu) => {
      si.currentLoad()
        .then((load) => {
          si.mem()
            .then((mem) => {
              const Hardware = {

                cpubrand: cpu.brand,
                cpucores: cpu.cores,
                cpuspeed: cpu.speed,
                load: load.currentload,
                memorytotal: mem.total,
                memoryfree: mem.free,
              };
              resolve(Hardware);
            })
            .catch((error) => console.error(error));
        })
        .catch((error) => console.error(error));
    })
    .catch((error) => console.error(error));
});

function Round2Dec(num) {
  return Math.round(num * 100) / 100;
}

exports.Hardware = Hardware;
