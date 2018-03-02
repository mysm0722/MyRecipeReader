var express = require('express');
// import 'axios' module
const axios = require('axios');
// Encoding QueryString 
const qs = require('querystring');
// File Stream
var fs = require('fs');
// Nodejs Dom Service
const cheerio = require('cheerio');

var app = express();
var client_id = 'Bx3k9QA02ShYeDVyLQpf';
var client_secret = 'DvfCZekAZs';

// Node.JS Server Router
// parameters {
//    query: "레시피이름",
//    en_file: "영문 파일명" (텍스트파일과 mp3 파일명으로 저장됨)
// }
app.get('/recipeReader/:query/:en_file', function (req, res) {

  console.log('::: naverSearchAPI(백과사전) is called.');
  console.log('::: Search Keyword : ' + req.params.query);
  console.log('::: En Filename : ' + req.params.en_file);

  // NAVER Search API (백과사전))
  var config = {
    headers: {
      'X-Naver-Client-Id' : client_id,
      'X-Naver-Client-Secret' : client_secret
    }
  };

  var textStr = '';
  var resultStr;
  // for Browser Print
  var htmlStr = '<p><b><font color="orange">[ Search Keyword ]</font></b></p>'+
                '<b>' + req.params.query + '</b><br><br>' +
                '<p><b><font color="blue">[ Recipe Information ]</font></b></p>';

  // NAVER Search API (백과사전)) 
  axios.get(
    `https://openapi.naver.com/v1/search/encyc.json?query=${qs.escape(req.params.query)}&display=1&start=1`,
    config
  )
    .then( response=>{
     
      res.writeHead(200, { 'Content-Type': 'text/html;charset=UTF-8' });
      
      htmlStr += response.data.items[0].title + '<br>' +
                  response.data.items[0].link + '<br>' +
                  response.data.items[0].description + '<br>' + 
                  '<img src="' + response.data.items[0].thumbnail + '"><br>';

      var http = require('http');
      var dest = req.params.en_file;
      var url = response.data.items[0].link;

      // Synthesis mp3 file
      // Clova CSS API Url
      var destMp3File = './voice_recipe/';
      var ttsUrl = 'https://openapi.naver.com/v1/voice/tts.bin';

      axios(url)
      .then(res => res.data)
      .then(html => {
          const $ = cheerio.load(html);
          fs.writeFileSync('./text_recipe/'+dest+'.txt', $('#size_ct').text().trim());
      }).then(returnStr => {
        var config = {
          headers: {'X-Naver-Client-Id':client_id, 'X-Naver-Client-Secret': client_secret} 
        };

        // Recipe 검색 결과를 파일로 저장합니다.
        // 음성 합성을 위해 HTML 태그가 제거된 텍스트 형태로 저장합니다.
        var tranTextStr = fs.readFileSync('./text_recipe/'+req.params.en_file+'.txt', 'utf8');
        console.log(tranTextStr);

        // Clova CSS API
        var request = require('request');
        var options = {
            url: ttsUrl,
            form: {'speaker':'mijin', 'speed':'2', 'text':tranTextStr},
            headers: {'X-Naver-Client-Id':client_id, 'X-Naver-Client-Secret': client_secret}
        };

        // Clova CSS를 활용하여 텍스트 파일을 읽어서 mp3 파일을 생성합니다.
        var writeStream = fs.createWriteStream(destMp3File+req.params.en_file+'.mp3');
        var _req = request.post(options).on('response', function(response) {
          console.log(response.statusCode) // 200
          console.log(response.headers['content-type'])
        });

        // close mp3 file stream 
        _req.pipe(writeStream); 

        // close html write
        res.write(htmlStr);
        res.end();

      });
    })
    .catch( error =>{
      console.log( error );
    })
});

app.listen(3000, function () {
  console.log('::: MyRecipeReader Service App listening on port 3000!');
});