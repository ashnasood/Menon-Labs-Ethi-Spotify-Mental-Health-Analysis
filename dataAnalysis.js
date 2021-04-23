const fs = require('fs');
const readline = require('readline');

const throwErrorCb = (err) => {if (err) throw err;};

const emotions = ['Heartbroken', 'Upbeat', 'Romantic', 'Cheerful', 'Rebellious', 'Calm', 'Powerful', 'Carefree', 'Party Music', 'Reflective', 'Energized', 'Warm', 'Sentimental', 'Chill', 'Exuberant']

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


function databaseInit() {
    
}

history = getHistory(process.argv[2]);
console.log('history read!');
console.log(`${history.length} songs in history`);
console.log();

sessions = getListeningSessions(history);
console.log('sessions parsed!');
console.log(`${sessions.length} valid sessions`);
console.log();


sessionsStr = JSON.stringify(sessions, null, 4);
fs.writeFileSync(process.argv[3], sessionsStr);
console.log('file written!');
