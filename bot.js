const SteemBot = require('steem-bot').default;
const express = require('express');
const bodyParser = require("body-parser");
const fs = require('fs');
var app = express();

app.set("view engine", "ejs");
app.set("views", __dirname);
app.use(bodyParser.urlencoded({ extended: false }));

const username = 'Your Steem Username';
// we only use active key here since we need to transfer back the money
// using postingKey for posting comment is not necessary since if it's not available steem-bot automatically pick activeKey
const activeKey = 'Your Private Active Key'; // Use environment variables instead of hardcoding to be safer

// helper function to identify if memo has a valid steemit link
function isValidSteemitLink(link) {
  return link.indexOf('steemit.com') > -1;
}

const bot = new SteemBot({username, activeKey});

bot.onDeposit(username, handleDeposit);

function handleDeposit(data, responder) {
  // Only vote if user sent equal or more than 2 Steem or SBD and has a valid Steemit link in memo
  if (parseFloat(data.amount) >= 0.01 &&  isValidSteemitLink(data.memo)) {
    // generate a float number between 1 and 5
    const randomVote = (Math.random() * 4).toFixed(2) + 1;

    fs.readFile('database.json', function (err, data) {
    var json = JSON.parse(data);
    json.data.push({
      "user" : data.from,
      "amount" : data.amount,
      "vote" : randomVote.toString() + "%",
      "link" : data.memo,
      "date": new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '')
    });

    fs.writeFile("database.json", JSON.stringify(json));
    });

    responder.upvoteOnMemo(randomVote)
      .then(() => {
        responder.commentOnMemo(
          `This post received a ${randomVote}% upvote from @WhaleSong thanks to @${data.from}! For more information, click here!`
        );
      });
  } else {
    // We are good people. Just send back the money if is less than 2 or doesn't have the right memo.
    if (data.amount.indexOf('STEEM') > -1) {
      responder.sendSteem(
        data.amount,
        'Sending back the money, should be at least 2 STEEM or SBD with a valid steemit link in memo'
      );
    } else {
      responder.sendSbd(
        data.amount,
        'Sending back the money, should be at least 2 STEEM or SBD with a valid steemit link in memo'
      );
    }
  }
}

var PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  bot.start();
  console.log("Bot Panel online on http://localhost:"+PORT);
});
