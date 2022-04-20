const { executionAsyncResource } = require("async_hooks");
const ytdl = require("ytdl-core");
const { YTSearcher } = require("ytsearcher");
const { Client, Intents } = require("discord.js"); //import discord.js
var fs = require("fs"); //import fs

const searcher = new YTSearcher({ //use ytsearcher and google api key for search on youtube
  key: "AIzaSyDe1RX3kxAheSg2AoP2IvmQHOTXHQKkOU8",
  revealed: true,
});

require("dotenv").config(); //initialize dotenv

const client = new Client({
  intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES], //initialize discord.js
}); //create new client

const queue = new Map(); //create new map for queues

client.on("ready", () => {
  console.log(`Tuna: im online!`);
});

client.login(process.env.CLIENT_TOKEN); //login bot using token
//time
const currenttime = Date(); //get current time

const time = new Date(currenttime).toLocaleTimeString("en", {
  timeStyle: "short",
  hour12: true,
});

//date
const currentdate = new Date();
const date = currentdate.getFullYear() + "-" + (currentdate.getMonth() + 1) + "-" + currentdate.getDate();


client.on("message", (msg) => { //when message is received

  var data = {}
  data.table = []

  console.log(msg.author.username + " {" + msg.author.id + "} : " + msg.content); //log message
  data.table.push(msg.author.id);

  fs.writeFile("result.json"), json.stringify(data), function (err) {
    if (err) throw err;
    console.log('complete');
  }

  switch (msg.content) {
    case "!date":
      msg.reply(date);
      break;
    case "!time":
      msg.reply(time);
      break;
    case "play":
      msg.reply("You mean !Play ?");
      break;
    case "stop":
      msg.reply("you mean !stop ?");
      break;
    case "leave":
      msg.reply("you mean !leave ?");
      break;
  }
});

client.on("message", async (message) => {
  const prefix = "!";

  const serverQueue = queue.get(message.guild.id); //get server queue

  const args = message.content.slice(prefix.length).trim().split(/ +/g);
  const command = args.shift().toLowerCase();

  switch (command) {  //switch case for commands
    case "play":
      execute(message, serverQueue);
      break;
    case "stop":
      stop(message, serverQueue);
      break;
    case "skip":
      skip(message, serverQueue);
      break;
  }

  async function execute(message, serverQueue) {
    let vc = message.member.voice.channel;
    if (!vc) {
      return message.channel.send("Please join a voice chat first");
    } else {
      let result = await searcher.search(args.join(" "), { type: "voice" });
      const songInfo = await ytdl.getInfo(result.first.url);

      let song = {
        title: songInfo.videoDetails.title,
        url: songInfo.videoDetails.video_url,
      };

      if (!serverQueue) {
        const queueConstructor = {
          txtChannel: message.channel,
          vChannel: vc,
          connection: null,
          songs: [],
          volume: 10,
          playing: true,
        };
        queue.set(message.guild.id, queueConstructor);

        queueConstructor.songs.push(song);

        try {
          let connection = await vc.join();
          queueConstructor.connection = connection;
          play(message.guild, queueConstructor.songs[0]);
        } catch (err) {
          console.error(err);
          queue.delete(message.guild.id);
          return message.channel.send(`Unable to join the voice chat ${err}`);
        }
      } else {
        serverQueue.songs.push(song);
        return message.channel.send(`The song has been added ${song.url}`);
      }
    }
  }
  function play(guild, song) {
    const serverQueue = queue.get(guild.id);
    if (!song) {
      serverQueue.vChannel.leave();
      queue.delete(guild.id);
      return;
    }
    const dispatcher = serverQueue.connection
      .play(ytdl(song.url))
      .on("finish", () => {
        serverQueue.songs.shift();
        play(guild, serverQueue.songs[0]);
      });
    serverQueue.txtChannel.send(`Now playing ${serverQueue.songs[0].url}`);
  }
  function stop(message, serverQueue) {
    if (!message.member.voice.channel)
      return message.channel.send("You need to join the voice chat first!");
    serverQueue.songs = [];
    serverQueue.connection.dispatcher.end();
  }
  function skip(message, serverQueue) {
    if (!message.member.voice.channel)
      return message.channel.send("You need to join the voice chat first");
    if (!serverQueue) return message.channel.send("There is nothing to skip!");
    serverQueue.connection.dispatcher.end();
  }
});