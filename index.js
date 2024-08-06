import ffmpeg from "fluent-ffmpeg";
import fs from 'fs'

class StreamPotWithChaining {
  constructor() {
    this.chains = []
    this.ffmpeg = ffmpeg()
    this.outputs = []
  }
  input(input) {
    this.ffmpeg.input(input)
    return this
  }
  output(output) {
    this.ffmpeg.output(output)
    this.outputs.push(output)
    return this
  }
  setStartTime(start) {
    this.ffmpeg.setStartTime(start)
    return this
  }
  chain() {
    this.chains.push(this.ffmpeg)
    this.ffmpeg = ffmpeg()
    return this
  }
  cleanUp() {
    this.outputs.forEach((output, index) => {
      if (index !== this.outputs.length - 1) {
        fs.unlinkSync(output)
      }
    })
  }
  async runAndWait() {
    for (const chainedffmpeg of this.chains) {
      await new Promise((resolve, reject) => {
        chainedffmpeg.on('end', resolve).on('error', reject).run();
      });
    }
    return new Promise((resolve, reject) => {
      this.ffmpeg.on('end', () => {
        resolve(this.outputs[this.outputs.length - 1])
        this.cleanUp()
    }).on('error', reject).run();
    });
  }
}

const ffmpegChained = new StreamPotWithChaining()
async function main() {
    const result = await ffmpegChained
        .input('input.mp4')
        .output('output.mp3')
        .chain() // converts the video to mp3
        .input('output.mp3')
        .setStartTime(10) 
        .output('shortoutput.mp3')
        .chain() // gets the mp3 file from 10 seconds to the end
        .input('input.png')
        .input('shortoutput.mp3')
        .output('output.mp4')
        .runAndWait() // combines the image and audio
    console.log(result)
}
main()