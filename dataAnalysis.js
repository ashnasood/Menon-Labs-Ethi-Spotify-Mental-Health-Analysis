const fs = require('fs');

const throwErrorCb = (err) => {if (err) throw err;};

async function main() {
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
            let data = await fs.readFile('test_data/'+file, 'utf8', (err, jsonString) => {
                if (err) {
                    console.log("File read failed:", err)
                    throw err;
                }
                arr = JSON.parse(jsonString);
                console.log(file);
                return Promise(arr);

                // console.log(arr.length);
                // history = history.concat(arr);
            })
            console.log('here');
        }

        console.log(history[0]);
        console.log(history.length);
    }
    catch (err) {
        console.error(err);
    }
}

main();
