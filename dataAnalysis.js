const fs = require('fs');

const throwErrorCb = (err) => {if (err) throw err;};


class ListeningSession {
    constructor(songs) {
        this.size = songs.length;
        this.time = songs[0].endTime;
        this.songList = songs;
    }
}




function getHistory() {
    try {
        const files = fs.readdirSync('test_data', throwErrorCb);

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
            let data_str = fs.readFileSync('test_data/'+file, {encoding: 'utf8'})
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


function getListeningSessions(history) {

    // copy tracks with > 30s of time played into new array
    tracks = [];
    for (track of history) {
        if (track.msPlayed > 30000)
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
        if (group.length > 10) {
            sessions.push(new ListeningSession(group));
        }
    }

    return sessions;
}

history = getHistory();
console.log('history read!');
sessions = getListeningSessions(history);
console.log('sessions parsed!');

sessionsStr = JSON.stringify(sessions);
fs.writeFileSync('sessions.json', sessionsStr);
console.log('file written!');
