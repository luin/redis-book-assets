var fs = require('fs');
var readline = require('readline');
var csv = require('csv');
var redis = require('redis');
var client = redis.createClient();

csv().from.stream(fs.createReadStream('ip.txt')).on('record', importIP);


// 在字符串前补'0'。
// pad('11', 3) => '011'
function pad(num, n) {
    var len = num.length;
    while(len < n) {
        num = '0' + num;
        len++;
    }
    return num;
}

// 将IP地址转换成10进制数字
// convertIPtoNumber('127.0.0.1') => 2130706433
function convertIPtoNumber(ip) {
  var result = '';
  ip.split('.').forEach(function (item) {
    item = parseInt(item, 10);
    item = item.toString(2);
    item = pad(item, 8);
    result += item;
  });
  return parseInt(result, 2);
}

// 将IP数据加入Redis
// 输入格式："['上海', '202.127.0.0', '202.127.4.255']"
function importIP (data) {
  var location = data[0];
  var minIP = convertIPtoNumber(data[1]);
  var maxIP = convertIPtoNumber(data[2]);
  client.zadd('ip', minIP, '*' + location, maxIP, location);
}

var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.setPrompt('IP> ');
rl.prompt();

rl.on('line', function (line) {
  ip = convertIPtoNumber(line);
  client.zrangebyscore('ip', ip, '+inf', 'LIMIT', '0', '1', function (err,result) {
    if (!Array.isArray(result) || result.length === 0) {
      // 该IP超出了数据库记录的最大IP地址
      console.log('No data.');
    } else {
      var location = result[0];
      if (location[0] === '*') {
        // 该IP不属于任何一个IP段
        console.log('No data.');
      } else {
        console.log(location);
      }
    }
    rl.prompt();
  });
});
