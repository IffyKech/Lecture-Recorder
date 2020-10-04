const { desktopCapturer, remote} = require("electron");
const { dialog } = remote;
const { writeFile } = require("fs");

// HTML Elements
const videoEle = document.querySelector("video");
const recordButton = document.getElementById("startRecord");
const stopButton = document.getElementById("stopRecord");

// Recorder for screen
let recorder;
const recorderChunks = [];


// add event listeners
recordButton.onclick = e => {
    recorder.start();
    recordButton.classList.add("is-danger");
    recordButton.innerText = "Recording";
}

stopButton.onclick = e => {
    recorder.stop();
    recordButton.classList.remove("is-danger");
    recordButton.innerText = "Record";
}


// Get and Log sources for testing
async function getVideoSources() {
    const videoSources = await desktopCapturer.getSources({
        types: ["window", "screen"]
    });

    // show the stream
    showStream(videoSources[0].id);

}


// Create Stream of desktop and preview it
async function showStream(sourceID) {

    // constraints for both audio and video
    const constraints = {
        audio: {
            mandatory: {
                chromeMediaSource: "desktop",
                echoCancellation: true
            }
        },

        video: {
            mandatory: {
                chromeMediaSource: "desktop"
            }
        }
    };

    // constraint for video only
    const videoConstraint = {
        audio: false,
        video: {
            mandatory: {
                chromeMediaSource: "desktop",
                chromeMediaSourceId: sourceID
            }
        }
    };

    // create stream
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    const videoStream = await navigator.mediaDevices.getUserMedia(videoConstraint);

    // preview stream
    // stream video only as playing the stream with audio will echo the audio
    videoEle.srcObject = videoStream;
    videoEle.play();

    // Create the recorder
    const options = { mimeType: "video/webm; codecs=vp9" }
    recorder = new MediaRecorder(stream, options);

    recorder.ondataavailable = handleDataAvailable;
    recorder.onstop = handleStop;

}

// capture chunks
function handleDataAvailable(e) {
    recorderChunks.push(e.data);
}

// save file on stop
async function handleStop(e) {
    const blob = new Blob(recorderChunks, {
        type: "video/webm; codecs=vp9"
    });

    const buffer = Buffer.from(await blob.arrayBuffer());

    const { filePath } = await dialog.showSaveDialog({
        title: "Save Video",
        buttonLabel: "Save Video",
        defaultPath: `${Date.now()}.webm`,
        // file extension options
        filters: [
            {name: "Videos - WEBM", extensions: ['webm']}
        ]
        });

    if (filePath) {
        writeFile(filePath, buffer, () => console.log("saved vid"));
    }

}

// init
window.onload = getVideoSources();