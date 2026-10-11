const { MsEdgeTTS, OUTPUT_FORMAT } = require('msedge-tts');

async function testVisemes() {
  const tts = new MsEdgeTTS();
  await tts.setMetadata('en-US-GuyNeural', OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_OPUS);

  const text = "Hello buddy, I am UNIN. Welcome to the future of 3D animation.";
  console.log("Synthesizing audio and extracting visemes for:", text);

  const readable = tts.toStream(text);

  const visemes = [];
  readable.on('data', (data) => {
    // Check if data is text metadata
    const str = data.toString('utf8');
    if (str.includes('Viseme')) {
      try {
        const jsonMatch = str.match(/\{.*"VisemeId".*\}/);
        if (jsonMatch) {
          visemes.push(JSON.parse(jsonMatch[0]));
        }
      } catch (e) {}
    }
  });

  readable.on('end', () => {
    console.log(`Extracted ${visemes.length} raw viseme frames!`);
    if (visemes.length > 0) {
      console.log("Sample Visemes (First 5):", visemes.slice(0, 5));
    }
  });
}

testVisemes().catch(console.error);
