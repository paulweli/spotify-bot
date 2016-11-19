const login = require('facebook-chat-api');
const prettyjson = require('prettyjson');
const config = require('./config.json');
const cmd = require('node-cmd');
const SpotifyWebApi = require('spotify-web-api-node');
const spotifyApi = new SpotifyWebApi({
  clientId : config.spotifyid,
  clientSecret : config.spotifysecret
});
let api;

function prettyConsole(data) {
  console.log(prettyjson.render(data));
}

// Trying to get an intro message at beginning of conversation, or when it is added to a group

// login({email: "", password: ""}, function callback (err, api) {
//     if(err) return console.error(err);

//     var yourID = "100014215535982";
//     var msg = {body: "Hey!"};
//     api.sendMessage(msg, yourID);
//     console.log(msg);
// });

// For creating playlists for groups

// async function checkThreadPlaylist(threadID) {
//   const playlists = await spotifyApi.getUserPlaylists(config.spotifyUsername);
//   prettyConsole(playlists);
// }

// async function getUser(username) {
//   prettyConsole(await spotifyApi.getUser(username));
// }

async function listenFacebook(err, message) {
  //checkThreadPlaylist(message.threadID);

  var queue_array = [];
  
  // cmd.run(message.body);
  const { body } = message;

  if (body.indexOf('play song') > -1) { // has the word play
    //const songToSearch = body.match(/play(.+)/)[1].trim();
    const songToSearch = body.split("song ")[1];
    console.log(`Song to search: ${songToSearch}`);
    const searchResults = await spotifyApi.searchTracks(songToSearch);
    const songToPlay = searchResults.body.tracks.items[0].uri;
    console.log(`Song to play: ${songToPlay}`);
    cmd.run(`spotify play uri ${songToPlay}`);
  } // api.sendMessage(message.body, message.threadID);

  else if (body.indexOf('https://open.spotify.com/user') > -1 ) { // is a spotify playlist link

    const playlistIdentifier = body.split("playlist/")[1]; // grabs the unique playlist identifier
    console.log(`playing spotify:user:kabirvirji:playlist:${playlistIdentifier}`);
    cmd.run(`spotify play uri spotify:user:kabirvirji:playlist:${playlistIdentifier}`);

  }

  else if (body.indexOf('queue') > -1) { // has the word queue

    const songToSearchforQueue = body.split("queue ")[1]; // takes just the song name eg. "queue songname" will just take songname
    const searchResultsforQueue = await spotifyApi.searchTracks(songToSearchforQueue); // search results like before
    const songToQueue = searchResultsforQueue.body.tracks.items[0].uri; // index at URI instread of name like before
    queue_array.push(songToQueue);

  }

  else if (body.indexOf('next') > -1) { // plays the next song
    cmd.run(`spotify next`);
  }


setInterval(function() {

  cmd.get(
    'spotify status',
    function(data) {
      var position = data.split("Position: ")[1];
      console.log(position);
      // now we have just: 3:46 / 3:46
      if (typeof position !== 'undefined') {
        var positionArray = position.split(' / '); // positionArray or position is not defined ?????
        // [ '3:46', '3:46' ] when song time is up
        var time = positionArray[1];
        var new_time = time.replace("\n", "");
        console.log(`Time of song: ${positionArray[0]} ${new_time}`);
      }
    } 
  )

if (typeof positionArray !== 'undefined' && typeof position === 'undefined') {
  //if (positionArray[0] == new_time) {
    // if the two elements in the array match each other then the song is finished
    cmd.run('spotify play uri ' + queue_array[0]); // play the first song in the array
    queue_array.shift(); // remove first element in array
  //}
}

}, 
1000);

  // cmd.get('spotify status') to get position of song ie) Position: 0:17 / 2:30 (check docs for the cmd function)
  // turn that into a percentage, or something to make sure the song is complete
  // THEN play the next song in the array

  // could also just get the time from spotify status and compare with the time from the search results (which is in ms, will need to convert)


}

async function init() {
  await initSpotify();
  // await getUser(config.spotifyUsername);
  api = await loginToFacebook();
  api.listen(listenFacebook);
}

async function initSpotify() {
  const { body } = await spotifyApi.clientCredentialsGrant();
  spotifyApi.setAccessToken(body['access_token']);
}

function loginToFacebook() {
  return new Promise((resolve, reject) => {
    login({ email: config.login, password: config.password }, (err, api) => {
      if (err) reject(err);
      resolve(api);
    })
  });
}

init();
