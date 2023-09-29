import express from 'express';
import { ObjectId } from 'mongodb';
import { connect } from 'amqplib';
import axios from 'axios';

if (!process.env.PORT) {
  throw new Error(
    'Please specify the port number for the HTTP server with the environment variable PORT.',
  );
}

if (!process.env.RABBIT) {
  throw new Error(
    'Please specify the name of the RabbitMQ host using environment variable RABBIT',
  );
}

const { PORT } = process.env;
const { RABBIT } = process.env;

//
// Application entry point.
//
async function main() {
  const connection = await connect(RABBIT); // Connects to the RabbitMQ server.

  const messageChannel = await connection.createChannel(); // Creates a RabbitMQ messaging channel.

  const app = express();

  //
  // Broadcasts the "video-uploaded" message.
  //
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function broadcastVideoUploadedMessage(videoMetadata: any) {
    console.log(`Publishing message on "video-uploaded" exchange.`);

    const msg = { video: videoMetadata };
    const jsonMsg = JSON.stringify(msg);
    messageChannel.publish('video-uploaded', '', Buffer.from(jsonMsg)); // Publishes the message to the "video-uploaded" exchange.
  }

  //
  // Route for uploading videos.
  //
  app.post('/upload', async (req, res) => {
    console.log('Uploading video');
    const fileName = req.headers['file-name'];
    const videoId = new ObjectId(); // Creates a new unique ID for the video.
    const response = await axios({
      // Forwards the request to the video-storate microservice.
      method: 'POST',
      url: 'http://video-storage/upload',
      data: req,
      responseType: 'stream',
      headers: {
        'file-name': fileName,
        'content-type': req.headers['content-type'],
        id: videoId.toString(),
      },
    });
    response.data.pipe(res);

    console.log('Broadcasting "video-uploaded" message.');
    // Broadcasts the message to other microservices.
    broadcastVideoUploadedMessage({
      id: videoId,
      name: fileName,
    });
  });

  // Other handlers go here.

  app.listen(PORT, () => {
    // Starts the HTTP server.
    console.log('Microservice online.');
  });
}

main().catch((err) => {
  console.error('Microservice failed to start.');
  console.error((err && err.stack) || err);
});
