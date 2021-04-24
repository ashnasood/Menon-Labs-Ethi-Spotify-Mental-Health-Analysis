const fs = require('fs');
const readline = require('readline');
const {performance} = require('perf_hooks');
const SpotifyWebApi = require('spotify-web-api-node');

const spotifyApi = new SpotifyWebApi({
    clientId: '69e1c0e4539041d7917c217c4b6f94cb',
    clientSecret: 'ffd609f69b4940eca3ee212b75de03b5',
});

// Retrieve an access token.
const accesTokenPromise = spotifyApi.clientCredentialsGrant().then(
  function(data) {
    console.log('The access token expires in ' + data.body['expires_in']);
    console.log('The access token is ' + data.body['access_token']);

    // Save the access token so that it's used in future calls
    spotifyApi.setAccessToken(data.body['access_token']);
  },
  function(err) {
    console.log('Something went wrong when retrieving an access token', err);
  }
);


const throwErrorCb = (err) => {if (err) throw err;};

const emotions = [
    'Heartbroken', 'Upbeat', 'Romantic', 'Cheerful', 'Rebellious', 'Calm', 
    'Powerful', 'Carefree', 'Party', 'Reflective', 'Energized', 'Warm', 
    'Sentimental', 'Chill', 'Exuberant'
]
const emptyEmotionFrequencies = function () {
    const dict = {};
    for (e of emotions)
        dict[e] = 0;
    return dict;
}



/**
 * @class ListeningSession utility object for all operations involving a session
 *
 * @field {number} size the number of songs in the session
 * @field {Date} time the date and time that the final song ended
 * @field {Array[Object]} songList the list of songs listened to during the session
 *      each object represents a single song and has the following fields:
 *          - endTime {Date}
 *          - trackName {String}
 *          - artistName {String}
 *          - msPlayed {number}
 *      array is sorted by endTime, with later times first
 */
class ListeningSession {
    /**
     * @param {Array[Object]} songs the list of songs to be part of the session
     *      each object should represent a single song and have the following fields:
     *          - endTime {Date}
     *          - trackName {String}
     *          - artistName {String}
     *          - msPlayed {number}
     *      array should be sorted by endTime, with later times first
     */
    constructor(songs) {
        this.size = songs.length;
        this.time = songs[0].endTime;
        this.songList = songs;
        this.frequencies = emptyEmotionFrequencies();
    }

    calculateEmotionFrequencies() {
        this.unfoundIndices = [];
        for (let i=0; i<this.songList.length; i++)
        {
            let e = emotionFromDatabase(this.songList[i]);
            if (e) {
                if (e === 'Party Music')
                    e = 'Party';
                this.frequencies[e] += 1;
            }
            else {
                this.unfoundIndices.push(i);
            }
        }

        return this.frequencies;
    }

    
}

/**
 * Get all songs the user has listened to from their data
 *
 * @param {String} folderPath the path to the folder of downloaded data
 * @return {Array[Object]} all songs in the streaming history
 *      each object represents a single song and has the following fields:
 *          - endTime {Date}
 *          - trackName {String}
 *          - artistName {String}
 *          - msPlayed {number}
 *      array is sorted by endTime, with later times first
 */
function getHistory(folderPath) {
    try {
        const files = fs.readdirSync(folderPath, throwErrorCb);

        // find streaming history files
        const historyFiles = [];
        for (const file of files) {
            if (file.includes('StreamingHistory')) {
                historyFiles.push(file);
            }
        }

        // add all streaming history entries into giant array
        let history = [];
        for (const file of historyFiles) {
            let data_str = fs.readFileSync(folderPath+'/'+file, {encoding: 'utf8'})
            const arr = JSON.parse(data_str);
            history = history.concat(arr);
        }

        // convert endTime to a proper datetime
        for (let entry of history) {
            dateAndTime = entry.endTime.split(' ');
            dateParts = dateAndTime[0].split('-');
            timeParts = dateAndTime[1].split(':');
            entry.endTime = new Date(
                parseInt(dateParts[0]), parseInt(dateParts[1]), parseInt(dateParts[2]),
                parseInt(timeParts[0]), parseInt(timeParts[1]), 0
            );

        }

        // sort history by end time
        history.sort((a, b) => b.endTime - a.endTime);
        return history;

    }
    catch (err) {
        console.error(err);
    }
}

/**
 * Divide straming history into listening sessions
 *
 * A listening session meets the following conditions:
 *      - each track was played for between 30 seconds and 10 minutes, inclusive
 *      - each pair of consecutive tracks was played within 30 minutes of each other, inclusive
 *      - the session contains at least 10 songs meeting the above two criteria
 *
 * @param {Array[Object]} history all the songs a user has listened to
 *      each object should represent a single song and have the following fields:
 *          - endTime {Date}
 *          - trackName {String}
 *          - artistName {String}
 *          - msPlayed {number}
 *      array should be sorted by endTime, with later times first
 *
 * @return {Array[ListeningSession]} all the valid listening sessions from the user's data
 *      array is sorted by endTime of final song in each session, with later times first
 */
function getListeningSessions(history) {

    // copy tracks with > 30s of time played into new array
    tracks = [];
    for (track of history) {
        if (track.msPlayed >= 30*1000 && track.msPlayed <= 10*60*1000)
            tracks.push(track);
    }

    // divide tracks into groups of songs with < 30m between each consecutive song
    groups = [[]];
    for (let i=0; i < tracks.length-2; i++) {
        groups[groups.length-1].push(tracks[i]);
        const diff = Math.abs(tracks[i].endTime - tracks[i+1].endTime);
        if (diff > 30*60*1000) {
            groups.push([]);
        }
    }

    // create session objects for all groups with > 10 songs
    sessions = [];
    for (group of groups) {
        if (group.length >= 10) {
            sessions.push(new ListeningSession(group));
        }
    }

    return sessions;
}

let dbSongs = [];
const cmpSong = function (a, b) { 
    return a.trackName.localeCompare(b.trackName) || a.artistName.localeCompare(b.artistName); 
};

function databaseInit() {
    data_str = fs.readFileSync('labeled_songs_records.json', {encoding: 'utf8'})
    dbSongs = JSON.parse(data_str);
    dbSongs.sort(cmpSong);
}

function emotionFromDatabase(song) {

    const binarySearch = function (song, l, r) {
        if (r < l || l < 0 || r > dbSongs.length)
            return -1;

        let mid = l + Math.floor((r-l)/2);
        let cmp = cmpSong(song, dbSongs[mid]);

        if (cmp === 0)
            return mid;
        else if (cmp > 0)
            return binarySearch(song, mid+1, r);
        else
            return binarySearch(song, l, mid-1);
    }

    const index = binarySearch(song, 0, dbSongs.length);
    if (index === -1)
        return "";
    else
        return dbSongs[index].emotion;
}
/*
databaseInit();
console.log('database initialized!\n');

history = getHistory(process.argv[2]);
console.log('history read!');
console.log(`${history.length} songs in history`);
console.log();

sessions = getListeningSessions(history);
console.log('sessions parsed!');
console.log(`${sessions.length} valid sessions\n`);

let totalSongs = 0;
let unfoundSongs = 0;
for (session of sessions) {
    session.calculateEmotionFrequencies();
    totalSongs += session.size;
    unfoundSongs += session.unfoundIndices.length;
}
console.log(`emotion frequencies calculated!\n`);
console.log(`${unfoundSongs} of ${totalSongs} not found`);
*/
Promise.resolve(accesTokenPromise).then( () => {
    spotifyApi.getArtistAlbums('43ZHCT0cAZBISjO8DG9PnE').then(
      function(data) {
        console.log('Artist albums', data.body);
      },
      function(err) {
        console.error(err);
      }
    );
});

